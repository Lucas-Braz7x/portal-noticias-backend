export class SearchUnavailableException extends Error {
  constructor() {
    super('Text search is unavailable: OpenSearch is disabled');
    this.name = 'SearchUnavailableException';
  }
}
