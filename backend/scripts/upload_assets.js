const fs = require("fs")
const fse = require('fs-extra')
const { NFTStorage, File } = require("nft.storage")

const endpoint = 'https://api.nft.storage' // the default

const token = process.env.API_KEY_NFT_STORAGE // your API key from https://nft.storage/manage

// const fullPath = "/home/ben/Documents/crypto_projects/CuriousKid/backend/assets/images/main/"
// const fullPath = "/home/ben/Documents/crypto_projects/CuriousKid/backend/assets/images/hidden/"
// const fullPath = "/home/ben/Documents/crypto_projects/CuriousKid/backend/assets/metadata/main/"
const fullPath = "/home/ben/Documents/crypto_projects/CuriousKid/backend/assets/metadata/hidden/"

async function main() {
    const images_final = []
    const files = await fse.readdir(fullPath)
    for (let i = 0; i < files.length; i++) {
        images_final.push(new File([await fs.promises.readFile(`${fullPath}${files[i]}`)], files[i]))
    }

    const storage = new NFTStorage({ endpoint, token })
    const cid = await storage.storeDirectory(images_final)
    console.log({ cid })
    const status = await storage.status(cid)
    console.log(status)
}
main()