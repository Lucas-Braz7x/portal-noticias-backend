import { Slug } from '@/modules/articles/domain/value-objects/slug.vo';

describe('Slug', () => {
  describe('create', () => {
    it('accepts a valid slug', () => {
      const slug = Slug.create('como-a-ia-esta-mudando-o-jornalismo');

      expect(slug.value).toBe('como-a-ia-esta-mudando-o-jornalismo');
    });

    it('normalizes uppercase and spaces', () => {
      const slug = Slug.create('  Como A IA Esta Mudando  ');

      expect(slug.value).toBe('como-a-ia-esta-mudando');
    });

    it('removes accents', () => {
      const slug = Slug.create('inteligência-artificial');

      expect(slug.value).toBe('inteligencia-artificial');
    });

    it('replaces special characters with hyphens', () => {
      const slug = Slug.create('next.js & react!');

      expect(slug.value).toBe('next-js-react');
    });

    it('throws when slug is empty after normalization', () => {
      expect(() => Slug.create('   ')).toThrow('Slug cannot be empty');
    });

    it('throws when slug contains only invalid characters', () => {
      expect(() => Slug.create('!!!')).toThrow('Slug cannot be empty');
    });
  });

  describe('fromTitle', () => {
    it('generates slug from title', () => {
      const slug = Slug.fromTitle(
        'Como a Inteligência Artificial está mudando o jornalismo',
      );

      expect(slug.value).toBe(
        'como-a-inteligencia-artificial-esta-mudando-o-jornalismo',
      );
    });
  });

  describe('equals', () => {
    it('returns true for same value', () => {
      const a = Slug.create('tecnologia');
      const b = Slug.create('tecnologia');

      expect(a.equals(b)).toBe(true);
    });

    it('returns false for different values', () => {
      const a = Slug.create('tecnologia');
      const b = Slug.create('economia');

      expect(a.equals(b)).toBe(false);
    });
  });
});
