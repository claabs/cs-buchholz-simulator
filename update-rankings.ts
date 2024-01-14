/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
// eslint-disable-next-line import/no-extraneous-dependencies
import { HLTV } from 'hltv';
import fs from 'node:fs';

const wait = async (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
const rankData = [];

const regions = [
  'United States',
  'Brazil',
  'Czech Republic',
  'Denmark',
  'Finland',
  'Germany',
  'Kazakhstan',
  'Latvia',
  'Poland',
  'Portuga',
  'Russia',
  'Sweden',
  'Ukraine',
  'United Kingdom',
  'China',
  'India',
  'Mongolia',
  'Australia',
];

console.log('Getting global ranking');
rankData.push(await HLTV.getTeamRanking());

for (const region of regions) {
  await wait(1000);
  console.log('Getting region ranking:', region);
  rankData.push(await HLTV.getTeamRanking({ country: region }));
}

const pointMappings: Record<string, number> = {};

rankData.forEach((ranking) => {
  ranking.forEach((team) => {
    pointMappings[team.team.name] = team.points;
  });
});
fs.writeFileSync(
  'src/hltv-team-points.ts',
  `export default ${JSON.stringify(pointMappings, null, 2)} as Record<string, number>;`,
  'utf-8'
);
