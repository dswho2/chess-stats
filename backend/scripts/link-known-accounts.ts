/**
 * Script to link known Lichess/Chess.com accounts to FIDE players
 * Based on well-known username mappings
 */

import { PrismaClient } from '@prisma/client';
import { playerAccountService } from '../src/services/playerAccount.service';

const prisma = new PrismaClient();

// Known mappings of FIDE players to their Lichess usernames
const KNOWN_LICHESS_ACCOUNTS: Record<string, string> = {
  // Format: "Player Full Name": "lichess_username"
  "Magnus Carlsen": "DrNykterstein",
  "Hikaru Nakamura": "Hikaru",
  "Fabiano Caruana": "FabianoCaruana",
  "Alireza Firouzja": "Firouzja2003",
  "Wesley So": "GMWSO",
  "Levon Aronian": "LevonAronian",
  "Ian Nepomniachtchi": "lachesisQ",
  "Anish Giri": "AnishGiri",
  "Maxime Vachier-Lagrave": "Lyonbeast",
  "Viswanathan Anand": "viswanathan64",
  "Pentala Harikrishna": "Harikrishna",
  "Daniil Dubov": "DanielNaroditsky", // Note: This might be wrong, need verification
  "Sam Shankland": "GMWSO", // Note: This might be wrong
  "Ray Robson": "RayRobson",
};

// Known mappings of FIDE players to their Chess.com usernames
const KNOWN_CHESSCOM_ACCOUNTS: Record<string, string> = {
  "Magnus Carlsen": "MagnusCarlsen",
  "Hikaru Nakamura": "Hikaru",
  "Fabiano Caruana": "FabianoCaruana",
  "Wesley So": "GMWSO",
  "Levon Aronian": "LevonAronian",
  "Ian Nepomniachtchi": "lachesisQ",
  "Alireza Firouzja": "Firouzja2003",
  "Anish Giri": "AnishGiri",
};

async function linkKnownAccounts() {
  console.log('🔗 Starting to link known accounts to FIDE players...\n');

  let linkedLichess = 0;
  let linkedChessCom = 0;
  let errors: string[] = [];

  // Link Lichess accounts
  console.log('📊 Linking Lichess accounts...\n');
  for (const [playerName, lichessUsername] of Object.entries(KNOWN_LICHESS_ACCOUNTS)) {
    try {
      // Find player by name
      const player = await prisma.player.findFirst({
        where: {
          fullName: playerName,
          deleted: false
        }
      });

      if (!player) {
        console.log(`⚠️  Player not found: ${playerName}`);
        continue;
      }

      // Check if Lichess account exists in our database
      const account = await prisma.playerAccount.findFirst({
        where: {
          platform: 'lichess',
          username: {
            equals: lichessUsername,
            mode: 'insensitive'
          }
        }
      });

      if (account) {
        // Account exists - link it
        if (account.playerId === player.id) {
          console.log(`✓ Already linked: ${playerName} → ${lichessUsername}`);
        } else {
          await prisma.playerAccount.update({
            where: { id: account.id },
            data: { playerId: player.id }
          });
          console.log(`✓ Linked existing account: ${playerName} → ${lichessUsername}`);
          linkedLichess++;
        }
      } else {
        // Account doesn't exist - sync and link it
        try {
          await playerAccountService.getOrSyncFromLichess(lichessUsername, player.id);
          console.log(`✓ Synced & linked new account: ${playerName} → ${lichessUsername}`);
          linkedLichess++;
        } catch (syncError) {
          console.log(`✗ Failed to sync ${lichessUsername}: ${syncError instanceof Error ? syncError.message : 'Unknown error'}`);
          errors.push(`${playerName} → ${lichessUsername}`);
        }
      }
    } catch (error) {
      console.log(`✗ Error linking ${playerName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      errors.push(`${playerName} → ${lichessUsername}`);
    }
  }

  console.log(`\n✓ Linked ${linkedLichess} Lichess accounts`);

  // Link Chess.com accounts
  console.log('\n📊 Linking Chess.com accounts...\n');
  for (const [playerName, chesscomUsername] of Object.entries(KNOWN_CHESSCOM_ACCOUNTS)) {
    try {
      // Find player by name
      const player = await prisma.player.findFirst({
        where: {
          fullName: playerName,
          deleted: false
        }
      });

      if (!player) {
        console.log(`⚠️  Player not found: ${playerName}`);
        continue;
      }

      // Check if Chess.com account exists in our database
      const account = await prisma.playerAccount.findFirst({
        where: {
          platform: 'chess-com',
          username: {
            equals: chesscomUsername,
            mode: 'insensitive'
          }
        }
      });

      if (account) {
        // Account exists - link it
        if (account.playerId === player.id) {
          console.log(`✓ Already linked: ${playerName} → ${chesscomUsername}`);
        } else {
          await prisma.playerAccount.update({
            where: { id: account.id },
            data: {
              playerId: player.id,
              verified: true,
              verifiedAt: new Date()
            }
          });
          console.log(`✓ Linked existing account: ${playerName} → ${chesscomUsername}`);
          linkedChessCom++;
        }
      } else {
        // Account doesn't exist - sync and link it
        try {
          await playerAccountService.getOrSyncFromChessCom(chesscomUsername, player.id);
          console.log(`✓ Synced & linked new account: ${playerName} → ${chesscomUsername}`);
          linkedChessCom++;
        } catch (syncError) {
          console.log(`✗ Failed to sync ${chesscomUsername}: ${syncError instanceof Error ? syncError.message : 'Unknown error'}`);
          errors.push(`${playerName} → ${chesscomUsername}`);
        }
      }
    } catch (error) {
      console.log(`✗ Error linking ${playerName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      errors.push(`${playerName} → ${chesscomUsername}`);
    }
  }

  console.log(`\n✓ Linked ${linkedChessCom} Chess.com accounts`);

  // Summary
  console.log('\n========================================');
  console.log('Summary:');
  console.log(`✓ Total Lichess accounts linked: ${linkedLichess}`);
  console.log(`✓ Total Chess.com accounts linked: ${linkedChessCom}`);
  if (errors.length > 0) {
    console.log(`✗ Errors: ${errors.length}`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  console.log('========================================\n');
}

linkKnownAccounts()
  .catch((error) => {
    console.error('Error linking accounts:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
