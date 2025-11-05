/**
 * Script to fix player names from "Last, First" to "First Last" format
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPlayerNames() {
  console.log('Starting to fix player names...\n');

  // Get all players with names in "Last, First" format
  const players = await prisma.player.findMany({
    where: {
      fullName: {
        contains: ','
      }
    }
  });

  console.log(`Found ${players.length} players with comma in name\n`);

  let fixed = 0;
  let skipped = 0;

  for (const player of players) {
    if (!player.fullName) continue;

    // Check if name contains comma
    if (player.fullName.includes(',')) {
      // Split on comma and reverse
      const parts = player.fullName.split(',').map(p => p.trim());

      if (parts.length === 2) {
        const [lastName, firstName] = parts;
        const newName = `${firstName} ${lastName}`;

        console.log(`Updating: "${player.fullName}" → "${newName}"`);

        await prisma.player.update({
          where: { id: player.id },
          data: { fullName: newName }
        });

        fixed++;
      } else {
        console.log(`Skipping complex name: "${player.fullName}"`);
        skipped++;
      }
    }
  }

  console.log(`\n✓ Fixed ${fixed} player names`);
  console.log(`⊘ Skipped ${skipped} names`);
}

fixPlayerNames()
  .catch((error) => {
    console.error('Error fixing player names:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
