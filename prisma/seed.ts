import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Política', slug: 'politica' },
  { name: 'Economia', slug: 'economia' },
  { name: 'Tecnologia', slug: 'tecnologia' },
  { name: 'Esportes', slug: 'esportes' },
  { name: 'Cultura', slug: 'cultura' },
];

const tags = [
  { name: 'Inteligência Artificial', slug: 'inteligencia-artificial' },
  { name: 'AWS', slug: 'aws' },
  { name: 'Next.js', slug: 'nextjs' },
  { name: 'Economia', slug: 'economia' },
  { name: 'Eleições', slug: 'eleicoes' },
  { name: 'Paraná', slug: 'parana' },
  { name: 'JavaScript', slug: 'javascript' },
  { name: 'Desenvolvimento Web', slug: 'desenvolvimento-web' },
  { name: 'Futebol', slug: 'futebol' },
  { name: 'Cinema', slug: 'cinema' },
];

const authors = [
  { name: 'Maria Silva' },
  { name: 'João Santos' },
  { name: 'Ana Costa' },
];

const articles = [
  {
    title: 'Como a Inteligência Artificial está mudando o jornalismo',
    slug: 'como-a-inteligencia-artificial-esta-mudando-o-jornalismo',
    summary:
      'Ferramentas de IA estão transformando a produção e distribuição de notícias.',
    content:
      '<p>A inteligência artificial está revolucionando o jornalismo moderno...</p>',
    publishedAt: new Date('2026-01-10T10:00:00Z'),
    author: 'Maria Silva',
    category: 'tecnologia',
    tags: ['inteligencia-artificial', 'desenvolvimento-web'],
  },
  {
    title: 'AWS anuncia novos serviços para startups brasileiras',
    slug: 'aws-anuncia-novos-servicos-para-startups-brasileiras',
    summary:
      'A Amazon Web Services expande ofertas para o ecossistema nacional.',
    content:
      '<p>A AWS apresentou novidades voltadas ao mercado brasileiro...</p>',
    publishedAt: new Date('2026-01-12T14:30:00Z'),
    author: 'João Santos',
    category: 'tecnologia',
    tags: ['aws', 'economia'],
  },
  {
    title: 'Next.js 15 traz melhorias de performance para aplicações web',
    slug: 'nextjs-15-traz-melhorias-de-performance',
    summary: 'Nova versão do framework React foca em renderização e cache.',
    content: '<p>O Next.js 15 foi lançado com foco em performance...</p>',
    publishedAt: new Date('2026-01-14T09:00:00Z'),
    author: 'Ana Costa',
    category: 'tecnologia',
    tags: ['nextjs', 'javascript', 'desenvolvimento-web'],
  },
  {
    title: 'Economia do Paraná registra crescimento no setor de tecnologia',
    slug: 'economia-do-parana-registra-crescimento-no-setor-de-tecnologia',
    summary: 'Setor tech impulsiona PIB estadual no último trimestre.',
    content:
      '<p>O Paraná apresentou crescimento expressivo no setor de TI...</p>',
    publishedAt: new Date('2026-01-16T11:00:00Z'),
    author: 'Maria Silva',
    category: 'economia',
    tags: ['economia', 'parana'],
  },
  {
    title: 'Eleições municipais: o que esperar para 2026',
    slug: 'eleicoes-municipais-o-que-esperar-para-2026',
    summary: 'Análise do cenário político para as próximas eleições.',
    content: '<p>As eleições municipais de 2026 prometem ser acirradas...</p>',
    publishedAt: new Date('2026-01-18T08:00:00Z'),
    author: 'João Santos',
    category: 'politica',
    tags: ['eleicoes', 'parana'],
  },
  {
    title: 'Athletico vence clássico e assume liderança do estadual',
    slug: 'athletico-vence-classico-e-assume-lideranca-do-estadual',
    summary: 'Time rubro-negro vence por 2 a 1 no Couto Pereira.',
    content: '<p>O Athletico Paranaense venceu o clássico...</p>',
    publishedAt: new Date('2026-01-20T22:00:00Z'),
    author: 'Ana Costa',
    category: 'esportes',
    tags: ['futebol', 'parana'],
  },
  {
    title: 'Festival de Cinema de Curitiba anuncia programação 2026',
    slug: 'festival-de-cinema-de-curitiba-anuncia-programacao-2026',
    summary: 'Mostra reunirá produções nacionais e internacionais.',
    content:
      '<p>O Festival de Cinema de Curitiba divulgou sua programação...</p>',
    publishedAt: new Date('2026-01-22T15:00:00Z'),
    author: 'Maria Silva',
    category: 'cultura',
    tags: ['cinema', 'parana'],
  },
  {
    title: 'Banco Central mantém taxa Selic em reunião do Copom',
    slug: 'banco-central-mantem-taxa-selic-em-reuniao-do-copom',
    summary: 'Comitê decide por manutenção da taxa básica de juros.',
    content: '<p>O Copom manteve a taxa Selic inalterada...</p>',
    publishedAt: new Date('2026-01-24T10:00:00Z'),
    author: 'João Santos',
    category: 'economia',
    tags: ['economia'],
  },
  {
    title: 'Governo federal anuncia pacote de investimentos em infraestrutura',
    slug: 'governo-federal-anuncia-pacote-de-investimentos-em-infraestrutura',
    summary: 'Medida visa impulsionar obras em rodovias e portos.',
    content:
      '<p>O governo anunciou um pacote bilionário de investimentos...</p>',
    publishedAt: new Date('2026-01-26T12:00:00Z'),
    author: 'Maria Silva',
    category: 'politica',
    tags: ['economia'],
  },
  {
    title: 'JavaScript continua como linguagem mais popular em 2026',
    slug: 'javascript-continua-como-linguagem-mais-popular-em-2026',
    summary: 'Pesquisa anual confirma liderança do ecossistema JS.',
    content:
      '<p>JavaScript mantém sua posição como linguagem mais utilizada...</p>',
    publishedAt: new Date('2026-01-28T09:30:00Z'),
    author: 'Ana Costa',
    category: 'tecnologia',
    tags: ['javascript', 'desenvolvimento-web'],
  },
  {
    title: 'Coritiba busca reforços para a temporada 2026',
    slug: 'coritiba-busca-reforcos-para-a-temporada-2026',
    summary: 'Diretoria do Coxa negocia com jogadores do mercado nacional.',
    content:
      '<p>O Coritiba iniciou as negociações para reforçar o elenco...</p>',
    publishedAt: new Date('2026-01-30T18:00:00Z'),
    author: 'João Santos',
    category: 'esportes',
    tags: ['futebol', 'parana'],
  },
  {
    title: 'Exposição de arte contemporânea abre no Museu Oscar Niemeyer',
    slug: 'exposicao-de-arte-contemporanea-abre-no-museu-oscar-niemeyer',
    summary: 'Mostra reúne obras de artistas paranaenses e nacionais.',
    content: '<p>O MON inaugura exposição de arte contemporânea...</p>',
    publishedAt: new Date('2026-02-01T14:00:00Z'),
    author: 'Maria Silva',
    category: 'cultura',
    tags: ['cinema'],
  },
  {
    title: 'Startups paranaenses atraem investimento recorde em janeiro',
    slug: 'startups-paranaenses-atraem-investimento-recorde-em-janeiro',
    summary: 'Ecossistema de inovação registra melhor mês da história.',
    content: '<p>Startups do Paraná captaram investimentos recordes...</p>',
    publishedAt: new Date('2026-02-03T10:00:00Z'),
    author: 'Ana Costa',
    category: 'economia',
    tags: ['economia', 'parana', 'aws'],
  },
  {
    title: 'IA generativa na redação: oportunidades e desafios éticos',
    slug: 'ia-generativa-na-redacao-oportunidades-e-desafios-eticos',
    summary: 'Redações discutem uso responsável de ferramentas de IA.',
    content: '<p>A IA generativa levanta questões éticas no jornalismo...</p>',
    publishedAt: new Date('2026-02-05T11:00:00Z'),
    author: 'Maria Silva',
    category: 'tecnologia',
    tags: ['inteligencia-artificial'],
  },
  {
    title: 'Reforma tributária: entenda as mudanças para 2026',
    slug: 'reforma-tributaria-entenda-as-mudancas-para-2026',
    summary: 'Especialistas explicam impactos da nova legislação.',
    content: '<p>A reforma tributária traz mudanças significativas...</p>',
    publishedAt: new Date('2026-02-07T08:00:00Z'),
    author: 'João Santos',
    category: 'politica',
    tags: ['economia', 'eleicoes'],
  },
  {
    title: 'Operação policial no litoral paranaense prende suspeitos',
    slug: 'operacao-policial-no-litoral-paranaense-prende-suspeitos',
    summary: 'Ação conjunta resultou em prisões e apreensões.',
    content: '<p>Uma operação policial no litoral resultou em prisões...</p>',
    publishedAt: new Date('2026-02-09T16:00:00Z'),
    author: 'Ana Costa',
    category: 'politica',
    tags: ['parana'],
  },
  {
    title: 'Cloud computing: tendências para o mercado brasileiro',
    slug: 'cloud-computing-tendencias-para-o-mercado-brasileiro',
    summary: 'Especialistas apontam crescimento da adoção de nuvem.',
    content: '<p>O mercado de cloud computing segue em expansão...</p>',
    publishedAt: new Date('2026-02-11T10:00:00Z'),
    author: 'Maria Silva',
    category: 'tecnologia',
    tags: ['aws', 'inteligencia-artificial'],
  },
  {
    title: 'Campeonato Paranaense entra na reta final',
    slug: 'campeonato-paranaense-entra-na-reta-final',
    summary: 'Disputa pelo título estadual se intensifica.',
    content: '<p>O Campeonato Paranaense entra na fase decisiva...</p>',
    publishedAt: new Date('2026-02-13T20:00:00Z'),
    author: 'João Santos',
    category: 'esportes',
    tags: ['futebol', 'parana'],
  },
  {
    title: 'Teatro Guaíra recebe musical baseado em clássico da literatura',
    slug: 'teatro-guaira-recebe-musical-baseado-em-classico-da-literatura',
    summary: 'Produção nacional estreia em Curitiba com elenco consagrado.',
    content: '<p>O Teatro Guaíra recebe estreia de musical nacional...</p>',
    publishedAt: new Date('2026-02-15T19:00:00Z'),
    author: 'Ana Costa',
    category: 'cultura',
    tags: ['cinema'],
  },
  {
    title: 'Mercado de trabalho em TI aquece no primeiro trimestre',
    slug: 'mercado-de-trabalho-em-ti-aquece-no-primeiro-trimestre',
    summary: 'Demanda por profissionais de tecnologia cresce 15%.',
    content: '<p>O mercado de TI registra aquecimento no Q1 de 2026...</p>',
    publishedAt: new Date('2026-02-17T09:00:00Z'),
    author: 'Maria Silva',
    category: 'economia',
    tags: ['desenvolvimento-web', 'javascript'],
  },
  {
    title: 'Frameworks JavaScript: comparativo entre Next.js e alternativas',
    slug: 'frameworks-javascript-comparativo-entre-nextjs-e-alternativas',
    summary: 'Análise técnica dos principais frameworks do mercado.',
    content: '<p>Comparamos Next.js com outras opções do ecossistema...</p>',
    publishedAt: new Date('2026-02-19T11:30:00Z'),
    author: 'João Santos',
    category: 'tecnologia',
    tags: ['nextjs', 'javascript', 'desenvolvimento-web'],
  },
  {
    title: 'Cultura paranaense é destaque em feira internacional',
    slug: 'cultura-paranaense-e-destaque-em-feira-internacional',
    summary: 'Artistas locais representam o estado em evento na Europa.',
    content: '<p>A cultura paranaense ganhou destaque internacional...</p>',
    publishedAt: new Date('2026-02-21T13:00:00Z'),
    author: 'Ana Costa',
    category: 'cultura',
    tags: ['parana', 'cinema'],
  },
];

async function main() {
  console.log('Seeding database...');

  await prisma.articleTag.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.author.deleteMany();

  const authorMap = new Map<string, string>();
  for (const author of authors) {
    const created = await prisma.author.create({ data: author });
    authorMap.set(author.name, created.id);
  }

  const categoryMap = new Map<string, string>();
  for (const category of categories) {
    const created = await prisma.category.create({ data: category });
    categoryMap.set(category.slug, created.id);
  }

  const tagMap = new Map<string, string>();
  for (const tag of tags) {
    const created = await prisma.tag.create({ data: tag });
    tagMap.set(tag.slug, created.id);
  }

  for (const article of articles) {
    const authorId = authorMap.get(article.author);
    const categoryId = categoryMap.get(article.category);

    if (!authorId || !categoryId) {
      throw new Error(`Missing reference for article: ${article.slug}`);
    }

    const createdArticle = await prisma.article.create({
      data: {
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        content: article.content,
        publishedAt: article.publishedAt,
        authorId,
        categoryId,
      },
    });

    for (const tagSlug of article.tags) {
      const tagId = tagMap.get(tagSlug);

      if (!tagId) {
        throw new Error(`Missing tag: ${tagSlug}`);
      }

      await prisma.articleTag.create({
        data: {
          articleId: createdArticle.id,
          tagId,
        },
      });
    }
  }

  console.log(`Seeded ${articles.length} articles.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
