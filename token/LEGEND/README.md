## Create token commands

## Grind address (optional)

8Uyfp3eFUvEUFTCvxXY1rF6u4C1qoTzJxenUpsGk4i7k

solana-keygen grind --starts-with LGND:20

### Create token

spl-token create-token --enable-metadata -p TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb --owner ~/.config/solana/id.json ~/SitesC/legends/LGNDeXXXaDDeRerwwHfUtPBNz5s6vrn1NMSt9hdaCwx.json
spl-token create-account LGNDeXXXaDDeRerwwHfUtPBNz5s6vrn1NMSt9hdaCwx

### Initialize metadata

spl-token initialize-metadata LGNDeXXXaDDeRerwwHfUtPBNz5s6vrn1NMSt9hdaCwx "Legends of SOL" "LEGEND" "https://shdw-drive.genesysgo.net/NZkFUhCfuhhDKnQnPjqVcanddkkaf51rVwYYhryxiZo/TIepJrQfgRNHCqf3DY9Cp.json"

### Mint

spl-token mint LGNDeXXXaDDeRerwwHfUtPBNz5s6vrn1NMSt9hdaCwx 18000000000
spl-token accounts LGNDeXXXaDDeRerwwHfUtPBNz5s6vrn1NMSt9hdaCwx --verbose
spl-token burn J7LFaSQAMBq8dxv9TAqqv3evqF21EcYm7uh6ddfSWpX2 13793030580

## JSON meta

https://shdw-drive.genesysgo.net/NZkFUhCfuhhDKnQnPjqVcanddkkaf51rVwYYhryxiZo/TIepJrQfgRNHCqf3DY9Cp.json
