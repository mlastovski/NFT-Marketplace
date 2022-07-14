import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";

async function main() {
  let ERC20Factory : ContractFactory;
	let erc20: Contract;
	let ERC721Factory: ContractFactory;
  let erc721: Contract;
	let ERC1155Factory: ContractFactory;
  let erc1155: Contract;
	let MarketplaceFactory: ContractFactory;
  let marketplace: Contract;
  
  ERC20Factory = await ethers.getContractFactory("ERC20");
  erc20 = await ERC20Factory.deploy("ShitCoin", "SHT", 18);
  await erc20.deployed();
  console.log("ERC20 deployed to:", erc20.address);

  ERC721Factory = await ethers.getContractFactory("NFT721");
  erc721 = await ERC721Factory.deploy();
  await erc721.deployed();
  console.log("NFT721 deployed to:", erc721.address);

  ERC1155Factory = await ethers.getContractFactory("NFT1155");
  erc1155 = await ERC1155Factory.deploy();
  await erc1155.deployed();
  console.log("NFT1155 deployed to:", erc1155.address);

  MarketplaceFactory = await ethers.getContractFactory("Marketplace");
  marketplace = await MarketplaceFactory.deploy(erc20.address, erc721.address, erc1155.address);
  await marketplace.deployed();
  console.log("Marketplace deployed to:", marketplace.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
