import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { unifiedResponse } from 'uni-response';

import { env } from '../config/env-config';
import { ERROR } from '../constants/messages';

const environment = env.NODE_ENV || 'prod';
const unsupportedCertificateFileMessage = 'Only .jpeg, .jpg, .png, and .pdf files are allowed';
const multerErrorMessages: Partial<Record<multer.ErrorCode, string>> = {
  LIMIT_FILE_SIZE: 'File size must not exceed 10MB',
  LIMIT_UNEXPECTED_FILE: 'Only one file field named "file" is allowed',
};

const checkContentType = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.get('Content-Type');

  if (!contentType || contentType !== 'application/json') {
    const response = unifiedResponse(false, 'Only application/json Content-Type is allowed');
    res.status(400).send(response);
    return;
  }

  next();
};

const checkContentTypeAsURLEncodedFormData = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const contentType = String(req.get('Content-Type')).split(';')[0];

  if (!contentType || contentType !== 'application/x-www-form-urlencoded') {
    res
      .status(400)
      .json(unifiedResponse(false, 'Content-Type required as application/x-www-form-urlencoded'));
    return;
  }

  next();
};

// Middleware to check host whitelist
const apiErrorHandler: ErrorRequestHandler = (err, req, res, next): void => {
  if (environment === 'development') {
    console.log('err', err);
  }
  req.log.error({ err }, 'API request failed');

  if (err instanceof multer.MulterError) {
    res
      .status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
      .json(unifiedResponse(false, multerErrorMessages[err.code] ?? err.message));
    return;
  }
  if (err instanceof Error && err.message === unsupportedCertificateFileMessage) {
    res.status(400).json(unifiedResponse(false, unsupportedCertificateFileMessage));
    return;
  }
  if (
    err instanceof SyntaxError &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err as any).status === 400 &&
    'body' in err
  ) {
    // Handle JSON syntax error
    res.status(400).json(unifiedResponse(false, 'Invalid JSON'));
    return;
  }
  if (err instanceof PrismaClientKnownRequestError) {
    // Handle Prisma validation errors
    if (err.meta) {
      const firstKey = Object.keys(err?.meta)[0];
      const cause = err?.meta[firstKey] as string;
      res.status(400).json(unifiedResponse(false, `Provided field id not found, ${cause}`));
      return;
    }
  }
  if (err instanceof PrismaClientUnknownRequestError) {
    res.status(400).json(unifiedResponse(false, err?.message));
    return;
  }
  if (err instanceof PrismaClientRustPanicError) {
    res.status(400).json(unifiedResponse(false, err?.message));
    return;
  }
  if (err instanceof PrismaClientInitializationError) {
    res.status(400).json(unifiedResponse(false, err?.message));
    return;
  }
  if (err instanceof PrismaClientValidationError) {
    res.status(400).json(unifiedResponse(false, err?.message));
    return;
  }
  // Handle other errors
  res.status(500).json(unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR));
  return;
};

const unmatchedRoutes = (req: Request, res: Response): void => {
  res.status(404).json(unifiedResponse(false, ERROR.ROUTE_NOT_FOUND));
  return;
};

export { apiErrorHandler, checkContentType, checkContentTypeAsURLEncodedFormData, unmatchedRoutes };
