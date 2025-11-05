/**
 * Test Script - Verify API Data Before Database Population
 *
 * This script fetches sample data from external APIs to verify
 * the structure before syncing to the database.
 */

import { FideService } from '../src/services/fide.service';
import { LichessService } from '../src/services/lichess.service';
import { TournamentMapper } from '../src/mappers/tournament.mapper';
import { PlayerMapper } from '../src/mappers/player.mapper';
import { PlayerAccountMapper } from '../src/mappers/playerAccount.mapper';

const fideService = new FideService();
const lichessService = new LichessService();

async function testFideAPI() {
  console.log('\n========================================');
  console.log('Testing FIDE API');
  console.log('========================================\n');

  try {
    // Test 1: Get top players
    console.log('1. Fetching top 5 FIDE players...\n');
    const topPlayers = await fideService.getTopPlayers(5);
    console.log('Top FIDE Players (Raw API Response):');
    console.log(JSON.stringify(topPlayers, null, 2));

    // Test 2: Map to Prisma format
    console.log('\n2. Mapping first player to Prisma format...\n');
    if (topPlayers.length > 0) {
      const mappedPlayer = PlayerMapper.fromFide(topPlayers[0]);
      console.log('Mapped Player (Prisma format):');
      console.log(JSON.stringify(mappedPlayer, null, 2));
    }

    // Test 3: Get specific player (Magnus Carlsen)
    console.log('\n3. Fetching Magnus Carlsen (FIDE ID: 1503014)...\n');
    const magnus = await fideService.getPlayerInfo('1503014');
    console.log('Magnus Carlsen (Raw API Response):');
    console.log(JSON.stringify(magnus, null, 2));

    console.log('\nMapped to Prisma format:');
    const mappedMagnus = PlayerMapper.fromFide(magnus);
    console.log(JSON.stringify(mappedMagnus, null, 2));

  } catch (error) {
    console.error('Error testing FIDE API:', error);
  }
}

async function testLichessPlayerAPI() {
  console.log('\n========================================');
  console.log('Testing Lichess Player API');
  console.log('========================================\n');

  try {
    // Test 1: Get top blitz players
    console.log('1. Fetching top 3 Lichess blitz players...\n');
    const topPlayers = await lichessService.getTopPlayers('blitz', 3);
    console.log('Top Lichess Blitz Players (Raw API Response):');
    console.log(JSON.stringify(topPlayers, null, 2));

    // Test 2: Get full player data to map to PlayerAccount
    console.log('\n2. Fetching full player data and mapping to PlayerAccount format...\n');
    if (topPlayers.length > 0) {
      const fullPlayer = await lichessService.getPlayer(topPlayers[0].id);
      const mappedAccount = PlayerAccountMapper.fromLichess(fullPlayer);
      console.log('Mapped PlayerAccount (new architecture):');
      console.log(JSON.stringify(mappedAccount, null, 2));
    }

    // Test 3: Get specific player (Magnus's Lichess account)
    console.log('\n3. Fetching DrNykterstein (Magnus on Lichess)...\n');
    const magnus = await lichessService.getPlayer('DrNykterstein');
    console.log('DrNykterstein (Raw API Response):');
    console.log(JSON.stringify(magnus, null, 2));

    console.log('\nMapped to PlayerAccount format (new architecture):');
    const mappedMagnus = PlayerAccountMapper.fromLichess(magnus);
    console.log(JSON.stringify(mappedMagnus, null, 2));

  } catch (error) {
    console.error('Error testing Lichess Player API:', error);
  }
}

async function testLichessTournamentAPI() {
  console.log('\n========================================');
  console.log('Testing Lichess Tournament API');
  console.log('========================================\n');

  try {
    // Test 1: Get current tournaments
    console.log('1. Fetching current Lichess tournaments...\n');
    const currentTournaments = await lichessService.getCurrentTournaments();

    console.log('Current Tournaments Summary:');
    console.log(`- Created: ${currentTournaments.created?.length || 0}`);
    console.log(`- Started: ${currentTournaments.started?.length || 0}`);
    console.log(`- Finished: ${currentTournaments.finished?.length || 0}`);

    // Show sample from each category
    if (currentTournaments.created?.length > 0) {
      console.log('\nSample Created Tournament (Raw API Response):');
      console.log(JSON.stringify(currentTournaments.created[0], null, 2));

      console.log('\nMapped to Prisma format:');
      const mapped = TournamentMapper.fromLichess(currentTournaments.created[0]);
      console.log(JSON.stringify(mapped, null, 2));
    }

    // Test 2: Get specific tournament details
    if (currentTournaments.started?.length > 0) {
      const firstStarted = currentTournaments.started[0];
      console.log('\n2. Fetching details for first started tournament...\n');
      console.log(`Tournament ID: ${firstStarted.id}`);

      const details = await lichessService.getTournament(firstStarted.id);
      console.log('\nTournament Details (Raw API Response):');
      console.log(JSON.stringify(details, null, 2));

      console.log('\nMapped to Prisma format:');
      const mappedDetails = TournamentMapper.fromLichess(details);
      console.log(JSON.stringify(mappedDetails, null, 2));
    }

  } catch (error) {
    console.error('Error testing Lichess Tournament API:', error);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         API Data Testing - Pre-Database Population        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Test each API sequentially
  await testFideAPI();
  await testLichessPlayerAPI();
  await testLichessTournamentAPI();

  console.log('\n========================================');
  console.log('Testing Complete!');
  console.log('========================================\n');
  console.log('Review the output above to ensure:');
  console.log('1. API responses contain expected data');
  console.log('2. Mapped data matches Prisma schema');
  console.log('3. All required fields are populated');
  console.log('4. Data types are correct');
  console.log('\nIf everything looks good, proceed with database population.');
}

// Run the tests
main().catch(console.error);
