import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const outputDir = join(__dirname, '../postman');
const collectionPath = join(
  outputDir,
  'secondlife-exchange.postman_collection.json',
);

// Créer le dossier de sortie s'il n'existe pas
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const collection = {
  info: {
    name: 'SecondLife Exchange API',
    description: "Collection Postman pour l'API SecondLife Exchange",
    schema:
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    version: '1.0.0',
  },
  variable: [
    {
      key: 'API_URL',
      value: 'http://localhost:4000',
      type: 'string',
    },
    {
      key: 'ACCESS_TOKEN',
      value: '',
      type: 'string',
    },
    {
      key: 'REFRESH_TOKEN',
      value: '',
      type: 'string',
    },
  ],
  item: [
    {
      name: 'Auth',
      item: [
        {
          name: 'Register',
          request: {
            method: 'POST',
            header: [
              {
                key: 'Content-Type',
                value: 'application/json',
              },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  email: 'user@example.com',
                  password: 'Password123!',
                  displayName: 'John Doe',
                },
                null,
                2,
              ),
            },
            url: {
              raw: '{{API_URL}}/api/v1/auth/register',
              host: ['{{API_URL}}'],
              path: ['api', 'v1', 'auth', 'register'],
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'if (pm.response.code === 201) {',
                  '    const response = pm.response.json();',
                  '    pm.collectionVariables.set("ACCESS_TOKEN", response.accessToken);',
                  '    pm.collectionVariables.set("REFRESH_TOKEN", response.refreshToken);',
                  '}',
                ],
              },
            },
          ],
        },
        {
          name: 'Login',
          request: {
            method: 'POST',
            header: [
              {
                key: 'Content-Type',
                value: 'application/json',
              },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  email: 'user@example.com',
                  password: 'Password123!',
                },
                null,
                2,
              ),
            },
            url: {
              raw: '{{API_URL}}/api/v1/auth/login',
              host: ['{{API_URL}}'],
              path: ['api', 'v1', 'auth', 'login'],
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'if (pm.response.code === 200) {',
                  '    const response = pm.response.json();',
                  '    pm.collectionVariables.set("ACCESS_TOKEN", response.accessToken);',
                  '    pm.collectionVariables.set("REFRESH_TOKEN", response.refreshToken);',
                  '}',
                ],
              },
            },
          ],
        },
        {
          name: 'Refresh Token',
          request: {
            method: 'POST',
            header: [
              {
                key: 'Content-Type',
                value: 'application/json',
              },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  refreshToken: '{{REFRESH_TOKEN}}',
                },
                null,
                2,
              ),
            },
            url: {
              raw: '{{API_URL}}/api/v1/auth/refresh',
              host: ['{{API_URL}}'],
              path: ['api', 'v1', 'auth', 'refresh'],
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'if (pm.response.code === 200) {',
                  '    const response = pm.response.json();',
                  '    pm.collectionVariables.set("ACCESS_TOKEN", response.accessToken);',
                  '    pm.collectionVariables.set("REFRESH_TOKEN", response.refreshToken);',
                  '}',
                ],
              },
            },
          ],
        },
        {
          name: 'Logout',
          request: {
            method: 'POST',
            header: [
              {
                key: 'Content-Type',
                value: 'application/json',
              },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  refreshToken: '{{REFRESH_TOKEN}}',
                },
                null,
                2,
              ),
            },
            url: {
              raw: '{{API_URL}}/api/v1/auth/logout',
              host: ['{{API_URL}}'],
              path: ['api', 'v1', 'auth', 'logout'],
            },
          },
        },
      ],
    },
    {
      name: 'Users',
      item: [
        {
          name: 'Get My Profile',
          request: {
            method: 'GET',
            header: [
              {
                key: 'Authorization',
                value: 'Bearer {{ACCESS_TOKEN}}',
              },
            ],
            url: {
              raw: '{{API_URL}}/api/v1/users/me',
              host: ['{{API_URL}}'],
              path: ['api', 'v1', 'users', 'me'],
            },
          },
        },
        {
          name: 'Update My Profile',
          request: {
            method: 'PATCH',
            header: [
              {
                key: 'Authorization',
                value: 'Bearer {{ACCESS_TOKEN}}',
              },
              {
                key: 'Content-Type',
                value: 'application/json',
              },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  displayName: 'John Updated',
                  bio: 'Updated bio',
                  location: 'Paris, France',
                  preferencesJson: {
                    notifications: true,
                    theme: 'dark',
                  },
                },
                null,
                2,
              ),
            },
            url: {
              raw: '{{API_URL}}/api/v1/users/me',
              host: ['{{API_URL}}'],
              path: ['api', 'v1', 'users', 'me'],
            },
          },
        },
        {
          name: 'Delete My Account',
          request: {
            method: 'DELETE',
            header: [
              {
                key: 'Authorization',
                value: 'Bearer {{ACCESS_TOKEN}}',
              },
            ],
            url: {
              raw: '{{API_URL}}/api/v1/users/me',
              host: ['{{API_URL}}'],
              path: ['api', 'v1', 'users', 'me'],
            },
          },
        },
      ],
    },
    {
      name: 'Exchanges',
      item: [
        {
          name: 'Create Exchange',
          request: {
            method: 'POST',
            header: [
              {
                key: 'Authorization',
                value: 'Bearer {{ACCESS_TOKEN}}',
              },
              {
                key: 'Content-Type',
                value: 'application/json',
              },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  responderId: 'user_id_here',
                  requestedItemTitle: 'iPhone 13 Pro',
                  offeredItemTitle: 'MacBook Air M1',
                },
                null,
                2,
              ),
            },
            url: {
              raw: '{{API_URL}}/api/v1/exchanges',
              host: ['{{API_URL}}'],
              path: ['api', 'v1', 'exchanges'],
            },
          },
        },
        {
          name: 'Get My Exchanges',
          request: {
            method: 'GET',
            header: [
              {
                key: 'Authorization',
                value: 'Bearer {{ACCESS_TOKEN}}',
              },
            ],
            url: {
              raw: '{{API_URL}}/api/v1/exchanges/me?page=1&limit=20&status=PENDING',
              host: ['{{API_URL}}'],
              path: ['api', 'v1', 'exchanges', 'me'],
              query: [
                {
                  key: 'page',
                  value: '1',
                },
                {
                  key: 'limit',
                  value: '20',
                },
                {
                  key: 'status',
                  value: 'PENDING',
                },
              ],
            },
          },
        },
        {
          name: 'Get Exchange by ID',
          request: {
            method: 'GET',
            header: [
              {
                key: 'Authorization',
                value: 'Bearer {{ACCESS_TOKEN}}',
              },
            ],
            url: {
              raw: '{{API_URL}}/api/v1/exchanges/exchange_id_here',
              host: ['{{API_URL}}'],
              path: ['api', 'v1', 'exchanges', 'exchange_id_here'],
            },
          },
        },
        {
          name: 'Update Exchange Status',
          request: {
            method: 'PATCH',
            header: [
              {
                key: 'Authorization',
                value: 'Bearer {{ACCESS_TOKEN}}',
              },
              {
                key: 'Content-Type',
                value: 'application/json',
              },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  status: 'ACCEPTED',
                },
                null,
                2,
              ),
            },
            url: {
              raw: '{{API_URL}}/api/v1/exchanges/exchange_id_here/status',
              host: ['{{API_URL}}'],
              path: ['api', 'v1', 'exchanges', 'exchange_id_here', 'status'],
            },
          },
        },
      ],
    },
  ],
};

writeFileSync(collectionPath, JSON.stringify(collection, null, 2));

console.log('🎉 Collection Postman générée avec succès !');
console.log(`📁 Fichier: ${collectionPath}`);
console.log(
  "📝 N'oubliez pas de remplacer les IDs dans les exemples par de vrais IDs",
);
