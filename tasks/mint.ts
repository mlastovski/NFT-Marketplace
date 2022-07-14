import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@nomicfoundation/hardhat-chai-matchers";
dotenv.config();

task("mint", "Mint an NFT (ERC721 || ERC1155) using Marketplace.sol")
  .addParam("standart", "721 or 1155")
  .addParam("id", "Token id")
  .addParam("amount", "Amount of tokens (if token standart is 721, then amount must be set to 1!)")
  .addOptionalParam("uri", " Token URI (For token standart 721 only!)")
  .setAction(async function (taskArgs, hre) {
    let transaction;

    const marketplaceAddress = "0xC0a042A1C66e252cB2370ED36BE34A25b4FD559F";
    const nft721address = "0x05500FA8d5662CEa87a302d1547C51eC05E1054C";
    const nft1155address = "0xA39ad3076c6FA378dc017E534a0931B5801bC6b7";

    const [owner] = await hre.ethers.getSigners();

    const Marketplace = await hre.ethers.getContractFactory("Marketplace");
    const marketplace = Marketplace.attach(marketplaceAddress);

    const NFT721 = await hre.ethers.getContractFactory("NFT721");
    const erc721 = NFT721.attach(nft721address);

    const NFT1155 = await hre.ethers.getContractFactory("NFT1155");
    const erc1155 = NFT1155.attach(nft1155address);

    await erc721.grantRole(erc721.OWNER(), marketplaceAddress);
    await erc1155.grantRole(erc1155.OWNER(), marketplaceAddress);
    
    if (taskArgs.standart == 721) {
      transaction = await marketplace.mint721(owner.address, taskArgs.uri);
    }

    if (taskArgs.standart == 1155) {
      transaction = await marketplace.mint1155(owner.address, taskArgs.id, taskArgs.amount, "0x");
    }

    console.log(transaction);
  });
