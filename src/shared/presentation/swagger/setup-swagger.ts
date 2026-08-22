import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'docs';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Portal de Notícias API')
    .setDescription(
      'API REST para listagem, busca, filtragem e ingestão de artigos.',
    )
    .setVersion('1.0')
    .addTag('health', 'Verificação de saúde da aplicação')
    .addTag('articles', 'Artigos publicados')
    .addTag('categories', 'Categorias editoriais')
    .addTag('tags', 'Tags editoriais')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'Chave de ingestão de artigos (RF08)',
      },
      'ingest-api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    jsonDocumentUrl: `${SWAGGER_PATH}-json`,
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
