# ADR-0004: Orquestração via ArticlesService

- **Status:** Aceito
- **Data:** 2026-08-20

## Contexto

Os endpoints de artigos (criar, atualizar, listar, buscar, detalhe) compartilham fluxos de orquestração entre domínio, persistência e busca. Padrões como Clean Architecture costumam criar um use case por operação.

O escopo do projeto é delimitado a um bounded context (`articles`) com poucos fluxos críticos.

## Decisão

Centralizar a orquestração em um único **`ArticlesService`** na camada application.

Não criar use cases separados por endpoint. Regras de negócio permanecem nas entidades de domínio; o service coordena repositórios e indexação.

## Consequências

### Positivas

- Menos arquivos e indireção desnecessária.
- Ponto único para entender fluxos de artigos.
- Controllers permanecem finos (delegam ao service).

### Negativas / trade-offs

- O service pode crescer se muitos fluxos forem adicionados; nesse caso, extrair métodos privados ou sub-serviços coesos.
- Menos alinhado a implementações DDD que exigem application service por comando.

### Neutras

- Testes de integração e unitários focam no service e nas entidades.

## Referências

- [arquitetura.md — Application](../arquitetura.md#22-application-orquestração)
- [SDD — Camadas](../SDD.md)
