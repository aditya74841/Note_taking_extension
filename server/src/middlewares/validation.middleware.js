import { ApiError } from '../utils/ApiError.js';

function formatValidationIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'request',
    message: issue.message,
    code: issue.code,
  }));
}

function validate(schema, source, target) {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(
        new ApiError(400, 'Request validation failed', formatValidationIssues(result.error.issues)),
      );
      return;
    }

    req[target] = result.data;
    next();
  };
}

export function validateBody(schema) {
  return validate(schema, 'body', 'body');
}

export function validateQuery(schema) {
  return validate(schema, 'query', 'validatedQuery');
}

export function validateParams(schema) {
  return validate(schema, 'params', 'validatedParams');
}
