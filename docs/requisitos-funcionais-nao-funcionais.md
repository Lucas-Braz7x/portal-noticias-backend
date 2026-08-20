# Requisitos Funcionais e Não Funcionais

> **Baseline do desafio** — espelho do teste técnico da Gazeta do Povo.  
> Define **o que** o sistema deve fazer. Decisões de implementação, contratos de API, modelos e arquitetura estão na [especificação técnica (SDD)](./SDD.md).

---

## 1. Contexto

Aplicação web de notícias/artigos composta por frontend, backend/API e uma proposta de arquitetura preparada para evolução em produção.

O sistema deve permitir a listagem, busca, filtragem e visualização de artigos, além de disponibilizar uma rotina simples para ingestão de conteúdo.

O escopo foi definido com base no teste técnico da vaga de Desenvolvedor(a) Fullstack da Gazeta do Povo.

**Documentação relacionada**

| Documento | Conteúdo |
|-----------|----------|
| [SDD.md](./SDD.md) | Especificação técnica: contratos, modelos, stack, arquitetura |
| [arquitetura.md](./arquitetura.md) | Camadas, padrões de código, TDD, estrutura de pastas |

---

## 2. Requisitos Funcionais

### RF01 — Listagem de artigos

O sistema deve permitir a visualização de uma lista de artigos publicados.

Cada artigo listado deve apresentar, no mínimo:
- título;
- resumo;
- data;
- autor;
- categoria/editoria;
- tags.

### RF02 — Paginação

O sistema deve permitir a navegação paginada entre os artigos.

A API deve receber os parâmetros necessários para controlar a paginação e retornar informações suficientes para que o frontend possa navegar entre as páginas.

### RF03 — Busca textual

O sistema deve permitir a busca textual por:
- título;
- resumo;
- conteúdo;
- tags.

A implementação da busca deve utilizar OpenSearch ou Elasticsearch.

### RF04 — Filtro por categoria

O sistema deve permitir filtrar os artigos por categoria/editoria.

### RF05 — Filtro por tag

O sistema deve permitir filtrar os artigos por tag.

### RF06 — Visualização do artigo

O usuário deve conseguir acessar uma página de detalhe de um artigo.

A página deve apresentar:
- título;
- data;
- autor;
- categoria;
- tags;
- conteúdo completo.

### RF07 — API de artigos

O backend deve disponibilizar endpoints para:
- listagem de artigos;
- busca de artigos;
- consulta de um artigo específico;
- ingestão de conteúdo.

### RF08 — Ingestão de artigos

O sistema deve disponibilizar uma rotina ou endpoint para cadastrar e atualizar artigos.

A proteção da operação poderá ser realizada por uma chave simples armazenada em variável de ambiente, sem necessidade de autenticação completa.

### RF09 — Persistência

Os artigos e seus dados relacionados devem ser persistidos em um banco de dados.

A solução deve utilizar um banco relacional ou NoSQL, sendo adotado PostgreSQL para a implementação.

### RF10 — Dados iniciais

O projeto deve disponibilizar pelo menos 20 artigos fictícios contendo:
- título;
- resumo;
- conteúdo;
- data;
- autor;
- categoria/editoria;
- tags.

Os dados poderão ser disponibilizados por seed ou script de carga.

### RF11 — Estados da interface

A aplicação deve apresentar estados adequados para:
- carregamento;
- ausência de resultados;
- erros nas operações.

---

## 3. Requisitos Não Funcionais

### RNF01 — TypeScript

A aplicação frontend deve utilizar React ou Next.js, preferencialmente com TypeScript.

### RNF02 — Backend

A aplicação deve possuir uma API própria em Node.js ou tecnologia equivalente.

### RNF03 — Separação de responsabilidades

A solução deve separar responsabilidades entre:
- frontend;
- backend/API;
- camada de persistência;
- serviço de busca.

### RNF04 — Tratamento de erros

A API deve possuir tratamento básico de erros e retornar respostas HTTP adequadas para as diferentes situações de sucesso e falha.

### RNF05 — Configuração por ambiente

Configurações sensíveis ou dependentes do ambiente devem ser obtidas por variáveis de ambiente.

Isso inclui, por exemplo:
- credenciais e conexão com PostgreSQL;
- configuração do OpenSearch;
- chave de proteção da ingestão;
- configurações relacionadas à infraestrutura.

### RNF06 — Containerização

O ambiente local deve ser reproduzível por meio de Docker.

Os serviços necessários para desenvolvimento local devem ser disponibilizados por Docker Compose, incluindo o banco de dados e os componentes utilizados para simular a infraestrutura AWS quando aplicável.

### RNF07 — Testabilidade

O projeto deve possuir testes automatizados essenciais, contemplando principalmente as regras e componentes críticos da API e da busca.

### RNF08 — Qualidade de código

O código deve possuir:
- organização clara;
- separação de responsabilidades;
- legibilidade;
- baixo acoplamento;
- estrutura preparada para evolução.

### RNF09 — Escalabilidade

A solução deve ser projetada de forma que possa evoluir para uma arquitetura de produção escalável.

A documentação deve explicar possíveis usos de:
- AWS Lambda;
- containers em EC2/ECS ou serviço equivalente;
- banco de dados gerenciado;
- OpenSearch/Elasticsearch.

### RNF10 — Busca e persistência

O PostgreSQL deve atuar como fonte de persistência dos dados, enquanto o OpenSearch/Elasticsearch deve ser utilizado como mecanismo especializado para busca textual.

A arquitetura deve considerar a indexação dos artigos e estratégias para atualização, remoção e reindexação.

### RNF11 — Observabilidade

A arquitetura proposta deve incluir um plano básico de observabilidade, contemplando mecanismos para acompanhar:
- erros;
- disponibilidade;
- desempenho;
- comportamento da aplicação.

### RNF12 — Segurança

A solução deve considerar pontos básicos de segurança, incluindo:
- proteção da rotina de ingestão;
- gerenciamento de segredos por variáveis de ambiente;
- validação dos dados recebidos pela API;
- tratamento adequado de erros sem exposição desnecessária de informações internas.

### RNF13 — Manutenibilidade

A arquitetura e a implementação devem permitir evolução futura sem exigir alterações generalizadas no sistema.

### RNF14 — Documentação

O repositório deve conter documentação suficiente para:
- executar o projeto localmente;
- configurar banco de dados;
- configurar o mecanismo de busca;
- configurar variáveis de ambiente;
- entender a arquitetura;
- entender as decisões técnicas;
- conhecer alternativas consideradas;
- identificar funcionalidades implementadas e simuladas.

### RNF15 — Spec Driven Development

Antes da implementação deve existir uma mini especificação funcional e técnica contendo:
- problema e objetivo;
- principais fluxos;
- requisitos funcionais e não funcionais;
- endpoints;
- contratos de entrada e saída;
- modelos de dados;
- decisões arquiteturais;
- riscos;
- simplificações;
- próximos passos.

> Atendido por [SDD.md](./SDD.md), que referencia este documento como baseline de requisitos.

### RNF16 — Uso responsável de IA

Caso IA seja utilizada durante o desenvolvimento, o projeto deve documentar:
- prompts utilizados;
- partes em que a IA auxiliou;
- decisões técnicas revisadas pelo candidato;
- resumo da solução;
- principais trade-offs;
- dúvidas e premissas;
- próximos passos.

---

## 4. Fora do Escopo

Não fazem parte do escopo mínimo:
- autenticação completa;
- painel administrativo;
- fluxo editorial completo;
- plataforma editorial completa;
- produto pronto para escala real;
- implementação obrigatória de toda a infraestrutura AWS em produção;
- processamento assíncrono por filas como requisito da primeira versão.

Quando uma funcionalidade de produção for simulada ou apenas documentada, isso deve ser explicitado no README e na documentação da arquitetura.

---

## 5. Priorização

### Obrigatório para a primeira versão

- Listagem de artigos
- Paginação
- Busca textual
- Filtros por categoria e tag
- Página de detalhe
- API
- Persistência PostgreSQL
- Ingestão simples
- OpenSearch
- Tratamento de erros
- Loading e empty states
- Testes essenciais
- Docker
- README
- Mini especificação
- Documentação da arquitetura

### Arquitetura/documentação

- AWS
- Estratégia de escalabilidade
- Observabilidade
- Segurança
- Estratégia de indexação e reindexação
- Trade-offs entre Lambda e containers

### Possíveis diferenciais posteriores

- Docker Compose com OpenSearch
- Testes adicionais
- CI
- Cache
- Diagrama de arquitetura
- Fluxo assíncrono de ingestão e indexação
