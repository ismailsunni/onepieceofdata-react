import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes'

// Legacy /analytics/* paths are redirected by Cloudflare (public/_redirects).
export default [
  // Embed routes: no header, no page chrome
  route('embed/insights/:chartId', 'pages/EmbedInsightPage.tsx'),

  layout('layouts/AppLayout.tsx', [
    index('pages/HomePage.tsx'),
    route('timeline', 'pages/StoryTimelinePage.tsx'),
    route('characters', 'pages/CharactersPage.tsx'),
    route('characters/:id', 'pages/CharacterDetailPage.tsx'),
    route('arcs', 'pages/ArcsPage.tsx'),
    route('arcs/:id', 'pages/ArcDetailPage.tsx'),
    route('sagas', 'pages/SagasPage.tsx'),
    route('sagas/:id', 'pages/SagaDetailPage.tsx'),
    route('chapters', 'pages/ChaptersPage.tsx'),
    route('chapters/:number', 'pages/ChapterDetailPage.tsx'),
    route('volumes', 'pages/VolumesPage.tsx'),
    route('volumes/:number', 'pages/VolumeDetailPage.tsx'),
    route('analytics', 'pages/AnalyticsPage.tsx'),
    route('analytics/bounty', 'pages/analytics/BountyTopicPage.tsx'),
    route('analytics/appearances', 'pages/analytics/AppearancesTopicPage.tsx'),
    route('analytics/story', 'pages/analytics/StoryTopicPage.tsx'),
    route(
      'analytics/demographics',
      'pages/analytics/DemographicsTopicPage.tsx'
    ),
    route('analytics/characters', 'pages/analytics/CharactersTopicPage.tsx'),
    route(
      'analytics/affiliations',
      'pages/analytics/AffiliationsTopicPage.tsx'
    ),
    route('analytics/data-quality', 'pages/analytics/DataQualityTopicPage.tsx'),
    route('analytics/network', 'pages/NetworkAnalysisPage.tsx'),
    route('analytics/story-graph', 'pages/StoryGraphPage.tsx'),
    route('analytics/character-timeline', 'pages/CharacterTimelinePage.tsx'),
    route('analytics/chapter-releases', 'pages/ChapterReleaseCalendarPage.tsx'),
    route('analytics/word-cloud', 'pages/CharacterWordCloudPage.tsx'),
    route('analytics/appearance-race', 'pages/CharacterAppearanceRacePage.tsx'),
    route(
      'analytics/release-predictor',
      'pages/ChapterReleasePredictorPage.tsx'
    ),
    route('analytics/character-compare', 'pages/CharacterComparePage.tsx'),
    route('affiliations', 'pages/AffiliationsPage.tsx'),
    route('affiliations/:groupName', 'pages/AffiliationDetailPage.tsx'),
    route('occupations', 'pages/OccupationsPage.tsx'),
    route('occupations/:role', 'pages/OccupationDetailPage.tsx'),
    route('devil-fruits', 'pages/DevilFruitsPage.tsx'),
    route('devil-fruits/:slug', 'pages/DevilFruitDetailPage.tsx'),
    route('world-top-100', 'pages/WorldTopPollPage.tsx'),
    route('games', 'pages/GamesIndexPage.tsx'),
    route('games/guess-character', 'pages/CharacterQuizPage.tsx'),
    route('games/who-am-i', 'pages/WhoAmIPage.tsx'),
    route('games/one-chapter-wonders', 'pages/ArcQuizPage.tsx'),
    route('games/name-them-all', 'pages/NameThemAllPage.tsx'),
    route('games/mystery-character', 'pages/MysteryCharacterPage.tsx'),
    route('about', 'pages/AboutPage.tsx'),
    route('changelog', 'pages/ChangelogPage.tsx'),
    route('chat', 'pages/ChatPage.tsx'),
    route('*', 'pages/NotFoundPage.tsx'),
  ]),
] satisfies RouteConfig
