import { zodToJsonSchema } from 'zod-to-json-schema';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Import des schémas Zod
import { AuthRegisterSchema } from '../src/modules/auth/dtos/auth-register.dto';
import { AuthLoginSchema } from '../src/modules/auth/dtos/auth-login.dto';
import { TokenResponseSchema } from '../src/modules/auth/dtos/token-response.dto';
import { UpdateProfileSchema } from '../src/modules/users/dtos/update-profile.dto';
import { CreateExchangeSchema } from '../src/modules/exchanges/dtos/create-exchange.dto';
import { UpdateExchangeStatusSchema } from '../src/modules/exchanges/dtos/update-exchange-status.dto';
import { PaginationSchema } from '../src/common/dtos/pagination.dto';

const schemas = {
  'auth-register': AuthRegisterSchema,
  'auth-login': AuthLoginSchema,
  'token-response': TokenResponseSchema,
  'update-profile': UpdateProfileSchema,
  'create-exchange': CreateExchangeSchema,
  'update-exchange-status': UpdateExchangeStatusSchema,
  pagination: PaginationSchema,
};

const outputDir = join(__dirname, '../docs/schemas');

// Créer le dossier de sortie s'il n'existe pas
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Générer les schémas JSON
const generatedSchemas: Record<string, any> = {};

Object.entries(schemas).forEach(([name, schema]) => {
  const jsonSchema = zodToJsonSchema(schema, {
    target: 'openApi3',
    $refStrategy: 'none',
  });

  generatedSchemas[name] = jsonSchema;

  // Écrire le fichier individuel
  const filePath = join(outputDir, `${name}.json`);
  writeFileSync(filePath, JSON.stringify(jsonSchema, null, 2));

  console.log(`✅ Généré: ${name}.json`);
});

// Créer le fichier index
const indexPath = join(outputDir, 'index.json');
writeFileSync(indexPath, JSON.stringify(generatedSchemas, null, 2));

console.log('🎉 Tous les schémas JSON ont été générés avec succès !');
console.log(`📁 Dossier de sortie: ${outputDir}`);
