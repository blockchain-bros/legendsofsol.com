import { Command } from "commander";
import os from "os";
import fs from "fs";
import {
  createNft,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  addConfigLines,
  create,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-candy-machine";
import {
  createSignerFromKeypair,
  dateTime,
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
  sol,
  some,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import { LEGEND_TOKEN } from "../../src/types/api";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const umi = createUmi(process.env.NEXT_PUBLIC_SOLANA_NETWORK!);

const program = new Command();

program
  .name("Candy Machine Commands")
  .description("CLI to create a Candy Machine")
  .version("0.1.0")
  .option(
    "-k, --keypath <type>",
    "Path to the Solana keypair",
    path.join(os.homedir(), ".config", "solana", "id.json")
  );

const options = program.opts();
const CM_COUNT = 4200;

program
  .command("build_assets")
  .description("Load and build assets folder")
  .action(async () => {
    try {
      const assetsDir = path.join(__dirname, "assets");
      const buildDir = path.join(__dirname, "build");
      const metaPath = path.join(buildDir, "meta.json");
      const metaData = JSON.parse(
        fs.readFileSync(metaPath, { encoding: "utf8" })
      );
      const sourceGifPath = path.join(buildDir, "choose.gif");
      const gifType = "image/gif";

      // Clear the assets folder
      const files = await fs.promises.readdir(assetsDir);
      for (const file of files) {
        await fs.promises.unlink(path.join(assetsDir, file));
      }

      for (let i = 0; i < CM_COUNT; i++) {
        const n = i + 1; // Adjust n to start from 1 for file naming
        const newMeta = { ...metaData };
        newMeta.name = `The Choice #${String(n).padStart(4, "0")}`;
        newMeta.image = `${i}.gif`;

        // Update properties.files array
        newMeta.properties.files = [
          {
            uri: `${i}.gif`,
            type: gifType,
          },
        ];

        const newMetaPath = path.join(assetsDir, `${n - 1}.json`); // Use n - 1 for file naming to start from 0
        fs.writeFileSync(newMetaPath, JSON.stringify(newMeta, null, 2));

        // Copy the GIF file
        const newGifPath = path.join(assetsDir, `${n - 1}.gif`);
        fs.copyFileSync(sourceGifPath, newGifPath);

        // Copy all 'collection*' files from build to assets
        const buildFiles = await fs.promises.readdir(buildDir);
        const collectionFiles = buildFiles.filter(file => file.startsWith('collection'));
        for (const file of collectionFiles) {
            const sourcePath = path.join(buildDir, file);
            const destinationPath = path.join(assetsDir, file);
            fs.copyFileSync(sourcePath, destinationPath);
        }
      }

      console.log(`${CM_COUNT} asset files and GIFs have been built.`);
    } catch (error) {
      console.error(error);
    }
  });

program
  .command("create_collection")
  .description("Create a new Ccollection NFT and return the mint public key")
  .action(async () => {
    try {
      const authorityKeyPath = await options.keypath;

      const authorityKeyData = JSON.parse(
        fs.readFileSync(authorityKeyPath, { encoding: "utf8" })
      );
      const authorityKey = umi.eddsa.createKeypairFromSecretKey(
        new Uint8Array(authorityKeyData)
      );
      console.log(`Authority Public Key: ${authorityKey.publicKey}`);

      const authoritySigner = createSignerFromKeypair(umi, authorityKey);
      let umiWithSigner = umi
        .use(keypairIdentity(authoritySigner))
        .use(mplCandyMachine())
        .use(mplTokenMetadata());
      const jesterKey = umiWithSigner.eddsa.createKeypairFromSecretKey(
        new Uint8Array(JSON.parse(process.env.NEXT_JESTER!))
      );
      const collectionMint = createSignerFromKeypair(umiWithSigner, jesterKey);
      const tx = transactionBuilder().add(
        createNft(umiWithSigner, {
          mint: collectionMint,
          authority: authoritySigner,
          symbol: "CHOOSE",
          name: "The Choice",
          uri: "https://shdw-drive.genesysgo.net/NZkFUhCfuhhDKnQnPjqVcanddkkaf51rVwYYhryxiZo/TIepJrQfgRNHCqf3DY9Cp.json",
          sellerFeeBasisPoints: percentAmount(6.9, 2),
          isCollection: true,
        })
      );
      await tx.sendAndConfirm(umiWithSigner);

      console.log(`Collection Mint Public Key: ${collectionMint.publicKey}`);
    } catch (error) {
      console.error("Failed to create Candy Machine:", error);
    }
  });

program
  .command("create_cm")
  .description("Create a new Candy Machine")
  .action(async () => {
    try {
      const authorityKeyPath = await options.keypath;

      const authorityKeyData = JSON.parse(
        fs.readFileSync(authorityKeyPath, { encoding: "utf8" })
      );
      const authorityKey = umi.eddsa.createKeypairFromSecretKey(
        new Uint8Array(authorityKeyData)
      );
      console.log(`Authority Public Key: ${authorityKey.publicKey}`);

      const authoritySigner = createSignerFromKeypair(umi, authorityKey);
      let umiWithSigner = umi
        .use(keypairIdentity(authoritySigner))
        .use(mplCandyMachine())
        .use(mplTokenMetadata());
      const jesterKey = umiWithSigner.eddsa.createKeypairFromSecretKey(
        new Uint8Array(JSON.parse(process.env.NEXT_JESTER!))
      );
      const collectionMint = createSignerFromKeypair(umiWithSigner, jesterKey);
      const testMint = publicKey(
        "FRCoNmTQFUWa1k5S6gnLPZiq3da9ZephggEGnUrJuXRx"
      );
      const candyMachine = generateSigner(umiWithSigner);
      console.log(`Candy Machine Public Key: ${candyMachine.publicKey}`);
      const cm = await create(umiWithSigner, {
        candyMachine,
        collectionMint: collectionMint.publicKey,
        collectionUpdateAuthority: authoritySigner,
        authority: authoritySigner.publicKey,
        tokenStandard: TokenStandard.ProgrammableNonFungible,
        sellerFeeBasisPoints: percentAmount(6.9, 2),
        itemsAvailable: CM_COUNT,
        guards: {
          botTax: some({ lamports: sol(0.01), lastInstruction: true }),
          solPayment: some({
            lamports: sol(0),
            destination: publicKey(testMint),
          }),
          tokenGate: some({
            amount: 69420,
            mint: publicKey(LEGEND_TOKEN),
          }),
          startDate: some({ date: dateTime(1707454800) }),
        },
        creators: [
          {
            address: umiWithSigner.identity.publicKey,
            verified: true,
            percentageShare: 100,
          },
        ],
        configLineSettings: some({
          prefixName: "",
          nameLength: 32,
          prefixUri: "",
          uriLength: 200,
          isSequential: false,
        }),
      });
      await cm.sendAndConfirm(umiWithSigner);
    } catch (error) {
      console.error("Failed to create Candy Machine:", error);
    }
  });

program.parse(process.argv);
