const swaggerJsdoc = require('swagger-jsdoc');

const isVercel = process.env.VERCEL === '1';

const servers = isVercel
  ? [{ url: 'https://carded-backend.vercel.app', description: 'Production (Vercel)' }]
  : [
      { url: 'http://localhost:3000',             description: 'Local Dev' },
      { url: 'https://carded-backend.vercel.app', description: 'Production (Vercel)' },
    ];

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'Carded API',
      version:     '1.0.0',
      description: 'Backend API for Carded — Digital Visiting Cards App',
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http', scheme: 'bearer', bearerFormat: 'JWT',
          description: 'Paste token from /auth/login or /auth/google',
        },
      },
      schemas: {
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token:   { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id:       { type: 'string', format: 'uuid' },
                fullName: { type: 'string' },
                email:    { type: 'string' },
                phone:    { type: 'string' },
              },
            },
          },
        },
        Card: {
          type: 'object',
          properties: {
            id: { type: 'string' }, nickname: { type: 'string' },
            name: { type: 'string' }, designation: { type: 'string' },
            company: { type: 'string' }, email1: { type: 'string' },
            email2: { type: 'string' }, phone1: { type: 'string' },
            phone2: { type: 'string' }, website: { type: 'string' },
            address: { type: 'string' }, templateIndex: { type: 'integer' },
            photoUrl: { type: 'string' },
          },
        },
        CollectedCard: {
          type: 'object',
          properties: {
            id: { type: 'string' }, name: { type: 'string' },
            designation: { type: 'string' }, company: { type: 'string' },
            email1: { type: 'string' }, email2: { type: 'string' },
            phone1: { type: 'string' }, phone2: { type: 'string' },
            website: { type: 'string' }, address: { type: 'string' },
            scanType: { type: 'string', enum: ['carded', 'photo_card', 'qr_other'] },
            cardImageUrl: { type: 'string' }, qrRawData: { type: 'string' },
            remarks: { type: 'string' }, scannedAt: { type: 'string' },
          },
        },
      },
    },
    paths: {
      // ── AUTH ─────────────────────────────────────────────────
      '/auth/register': {
        post: {
          tags: ['Auth'], summary: 'Register new user',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object', required: ['fullName','email','phone','password'],
            properties: {
              fullName: { type: 'string', example: 'Rahul Sharma' },
              email:    { type: 'string', example: 'rahul@example.com' },
              phone:    { type: 'string', example: '9876543210' },
              password: { type: 'string', example: 'secret123' },
            },
          }}}},
          responses: {
            201: { description: 'Registered successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            409: { description: 'Email or phone already exists' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'], summary: 'Login with email or phone + password',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object', required: ['emailOrPhone','password'],
            properties: {
              emailOrPhone: { type: 'string', example: 'rahul@example.com' },
              password:     { type: 'string', example: 'secret123' },
            },
          }}}},
          responses: {
            200: { description: 'Login success', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/google': {
        post: {
          tags: ['Auth'], summary: 'Google Sign-In (send idToken from Flutter)',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object', required: ['idToken'],
            properties: { idToken: { type: 'string', description: 'Google ID token from Flutter google_sign_in' } },
          }}}},
          responses: {
            200: { description: 'Google auth success', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            401: { description: 'Invalid or expired Google token' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'], summary: 'Get current logged-in user',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'User info' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/auth/forgot-password': {
        post: {
          tags: ['Auth'], summary: 'Send OTP to email for password reset',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object', properties: { email: { type: 'string', example: 'rahul@example.com' } },
          }}}},
          responses: { 200: { description: 'OTP sent (always returns success for security)' } },
        },
      },
      '/auth/verify-otp': {
        post: {
          tags: ['Auth'], summary: 'Verify OTP — returns resetToken',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object',
            properties: { email: { type: 'string' }, otp: { type: 'string', example: '123456' } },
          }}}},
          responses: { 200: { description: 'Returns resetToken for /reset-password' } },
        },
      },
      '/auth/reset-password': {
        post: {
          tags: ['Auth'], summary: 'Reset password using resetToken',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object',
            properties: { resetToken: { type: 'string' }, newPassword: { type: 'string' } },
          }}}},
          responses: { 200: { description: 'Password reset successfully' } },
        },
      },
      '/auth/password': {
        put: {
          tags: ['Auth'], summary: 'Change password (logged-in user)',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object',
            properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string' } },
          }}}},
          responses: { 200: { description: 'Password updated' }, 401: { description: 'Wrong current password' } },
        },
      },

      // ── MY CARDS ─────────────────────────────────────────────
      '/cards': {
        get: {
          tags: ['My Cards'], summary: 'Get all my visiting cards',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Array of cards', content: { 'application/json': { schema: {
            type: 'object', properties: { cards: { type: 'array', items: { $ref: '#/components/schemas/Card' } } },
          }}}}}
        },
        post: {
          tags: ['My Cards'], summary: 'Create new visiting card (max 5)',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object', required: ['name','designation','company','email1','phone1'],
            properties: {
              nickname: { type: 'string', example: 'Work Card' },
              name: { type: 'string', example: 'Rahul Sharma' },
              designation: { type: 'string', example: 'Software Engineer' },
              company: { type: 'string', example: 'Acme Corp' },
              email1: { type: 'string', example: 'rahul@acme.com' },
              email2: { type: 'string' }, phone1: { type: 'string', example: '9876543210' },
              phone2: { type: 'string' }, website: { type: 'string' },
              address: { type: 'string' }, templateIndex: { type: 'integer', example: 0 },
            },
          }}}},
          responses: {
            201: { description: 'Card created' },
            403: { description: 'Card limit reached (max 5)' },
          },
        },
      },
      '/cards/{id}': {
        get: {
          tags: ['My Cards'], summary: 'Get single card',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Card data' }, 404: { description: 'Not found' } },
        },
        put: {
          tags: ['My Cards'], summary: 'Update visiting card',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Card' } } } },
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['My Cards'], summary: 'Delete visiting card',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/cards/{id}/photo': {
        post: {
          tags: ['My Cards'], summary: 'Upload profile photo for card',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'multipart/form-data': { schema: {
            type: 'object', properties: { photo: { type: 'string', format: 'binary' } },
          }}}},
          responses: { 200: { description: 'Returns photoUrl from Cloudinary' } },
        },
      },

      // ── COLLECTED CARDS ───────────────────────────────────────
      '/collected': {
        get: {
          tags: ['Collected Cards'], summary: 'Get all collected cards',
          security: [{ bearerAuth: [] }],
          parameters: [{
            name: 'type', in: 'query', description: 'Filter by scan type',
            schema: { type: 'string', enum: ['carded', 'photo_card', 'qr_other'] },
          }],
          responses: { 200: { description: 'Array of collected cards', content: { 'application/json': { schema: {
            type: 'object', properties: { collected: { type: 'array', items: { $ref: '#/components/schemas/CollectedCard' } } },
          }}}}},
        },
        post: {
          tags: ['Collected Cards'], summary: 'Save Carded QR scan',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object', required: ['name'],
            properties: {
              name: { type: 'string', example: 'Rahul Sharma' },
              designation: { type: 'string' }, company: { type: 'string' },
              email1: { type: 'string' }, email2: { type: 'string' },
              phone1: { type: 'string' }, phone2: { type: 'string' },
              website: { type: 'string' }, address: { type: 'string' },
              templateIndex: { type: 'integer' }, photoUrl: { type: 'string' },
            },
          }}}},
          responses: { 201: { description: 'Saved' } },
        },
      },
      '/collected/photo-card': {
        post: {
          tags: ['Collected Cards'], summary: 'Save physical card photo + OCR fields',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'multipart/form-data': { schema: {
            type: 'object', required: ['cardImage', 'name'],
            properties: {
              cardImage:   { type: 'string', format: 'binary', description: 'Card photo (JPG/PNG)' },
              name:        { type: 'string', example: 'Rahul Sharma' },
              designation: { type: 'string', example: 'Software Engineer' },
              company:     { type: 'string', example: 'Acme Corp' },
              phone1:      { type: 'string', example: '9876543210' },
              phone2:      { type: 'string' },
              email1:      { type: 'string', example: 'rahul@acme.com' },
              email2:      { type: 'string' },
              website:     { type: 'string' },
              address:     { type: 'string' },
            },
          }}}},
          responses: {
            201: { description: 'Saved — image uploaded to Cloudinary, all OCR fields stored' },
          },
        },
      },
      '/collected/qr-other': {
        post: {
          tags: ['Collected Cards'], summary: 'Save QR code scan (URL / vCard / plain text)',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object', required: ['name','qrRawData'],
            properties: {
              name:      { type: 'string', example: 'LinkedIn QR' },
              qrRawData: { type: 'string', example: 'https://linkedin.com/in/rahul' },
              parsedData: {
                type: 'object',
                properties: {
                  designation: { type: 'string' }, company: { type: 'string' },
                  email: { type: 'string' }, phone: { type: 'string' }, website: { type: 'string' },
                },
              },
            },
          }}}},
          responses: { 201: { description: 'Saved' } },
        },
      },
      '/collected/{id}': {
        get: {
          tags: ['Collected Cards'], summary: 'Get single collected card',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Card data' }, 404: { description: 'Not found' } },
        },
        put: {
          tags: ['Collected Cards'], summary: 'Update notes / category / lead type',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              name:     { type: 'string' }, category: { type: 'string' },
              leadType: { type: 'string' }, remarks:  { type: 'string' },
            },
          }}}},
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Collected Cards'], summary: 'Delete collected card',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;