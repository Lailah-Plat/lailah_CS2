import { Request, Response, NextFunction } from 'express';

export type ValidationRule = (value: any) => string | null;

export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    validate?: ValidationRule;
  };
}

export const validateRequest = (
  schema: ValidationSchema,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[source] || {};
    const errors: Record<string, string> = {};

    for (const [key, rules] of Object.entries(schema)) {
      const val = data[key];

      // Check required
      if (rules.required && (val === undefined || val === null || val === '')) {
        errors[key] = `الحقل '${key}' مطلوب.`;
        continue;
      }

      if (val !== undefined && val !== null && val !== '') {
        // Check type
        if (rules.type) {
          if (rules.type === 'array' && !Array.isArray(val)) {
            errors[key] = `يجب أن يكون الحقل '${key}' من نوع مصفوفة (Array).`;
            continue;
          } else if (rules.type === 'number') {
            const num = Number(val);
            if (isNaN(num)) {
              errors[key] = `يجب أن يكون الحقل '${key}' عدداً صالحاً.`;
              continue;
            }
          } else if (rules.type !== 'array' && typeof val !== rules.type) {
            errors[key] = `يجب أن يكون الحقل '${key}' من نوع ${rules.type}.`;
            continue;
          }
        }

        // Custom validation
        if (rules.validate) {
          const customError = rules.validate(val);
          if (customError) {
            errors[key] = customError;
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'فشل التحقق من صحة المدخلات.',
        validationErrors: errors
      });
    }

    next();
  };
};
