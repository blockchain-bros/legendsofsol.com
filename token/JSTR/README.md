## Create CM Commands

### Create assets

This will clear out the assets dir and build the assets from the source files.

```bash
ts-node './token/JSTR/cmd.ts' build_assets
ts-node './token/JSTR/cmd.ts' create_cm
```

## Sugar

cd /Users/bowie/SitesC/legends/token/JSTR

```bash
sugar launch -c '/Users/bowie/SitesC/legends/token/JSTR/config.json'
sugar guard add
sugar deploy (for uploading images)
sugar show 568LJXeYBsm5a6STJqmpAW8sgTtExCyHT2UY2RjsubG8
sugar config update --candy-machine 568LJXeYBsm5a6STJqmpAW8sgTtExCyHT2UY2RjsubG8 -c '/Users/bowie/SitesC/legends/token/JSTR/config.json'
sugar guard update
sugar upload '/Users/bowie/SitesC/legends/token/JSTR/assets' -c '/Users/bowie/SitesC/legends/token/JSTR/config.json'
sugar verify (update program in cache.json)
sugar withdraw
```

"date": "2024-02-10T17:00:00.000+13:00"

devnet
[1/3] 📦 Creating collection NFT for candy machine
Collection mint ID: Exv7R5BaBC75DD1x1XXQ1sYg8mb3dv1MAYkgudkdKaSn

[2/3] 🍬 Creating candy machine
Candy machine ID: ENs3v166sTXXjDDUz5zocTqK2Ecp2u3AArpxEXruRWXh


spl-token transfer FZ19jvoZhqrts77GQpCL5NXxuQPX9WkfxKAqWted8ifA 1 BURNYMEgrY2kAAEqSUEejpEjFwDtNwUakeDt15sF82FZ --allow-unfunded-recipient --fund-recipient

"tokenPayment": {
  "amount": 69420000000000,
  "mint": "FZ19jvoZhqrts77GQpCL5NXxuQPX9WkfxKAqWted8ifA",
  "destinationAta": "J1Z144Gs4qLdvhiRio5KwRcHieF6MJVarig2wMndjiS1"
}

mainnet
[1/3] 📦 Creating collection NFT for candy machine
Collection mint ID: 8fmefJZapGpyVMDzj4MSYQfR7mTET1oV9hXyu1axCjLE

[2/3] 🍬 Creating candy machine
Candy machine ID: 568LJXeYBsm5a6STJqmpAW8sgTtExCyHT2UY2RjsubG8

"tokenPayment": {
  "amount": 69420000000000,
  "mint": "LGNDeXXXaDDeRerwwHfUtPBNz5s6vrn1NMSt9hdaCwx",
  "destinationAta": "8Jq6Do6H5y5uEgAsZzefXXfT7Tw72tzs5wFSLzGpsDvE"
}
