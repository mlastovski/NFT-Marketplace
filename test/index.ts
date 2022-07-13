import { expect } from "chai";
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { Contract, ContractFactory } from "ethers";
import * as dotenv from "dotenv";
import { getContractFactory } from "hardhat/types";
dotenv.config();

describe("Marketplace", function () {
	let ERC20Factory : ContractFactory;
	let erc20: Contract;
	let ERC721Factory: ContractFactory;
  let erc721: Contract;
	let ERC1155Factory: ContractFactory;
  let erc1155: Contract;
	let MarketplaceFactory: ContractFactory;
  let marketplace: Contract;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, creator, addr1, addr2] = await ethers.getSigners();

		//deploy erc20
		ERC20Factory = await ethers.getContractFactory("ERC20");
		erc20 = await ERC20Factory.deploy("ShitCoin", "SHT", 18);
		await erc20.deployed();

    //deploy erc721
    ERC721Factory = await ethers.getContractFactory("NFT721");
    erc721 = await ERC721Factory.deploy();
    await erc721.deployed();

    //deploy erc1155
    // ERC1155Factory = await ethers.getContractFactory("NFT1155");
    // erc1155 = await ERC1155Factory.deploy();
    // await erc1155.deployed();

    //deploy Marketplace
    MarketplaceFactory = await ethers.getContractFactory("Marketplace");
    marketplace = await MarketplaceFactory.deploy(erc20.address, erc721.address, owner.address);
    await marketplace.deployed();

    //grantRoles to mint NFT
    await erc721.grantRole(erc721.OWNER(), marketplace.address);
    // await erc1155.grantRole(erc1155.CREATOR(), marketplace.address);

    //deposit and approve erc20 tokens to user2, user3
    await erc20.mint(addr1.address, 100000);
    await erc20.mint(addr2.address, 100000);
    await erc20.connect(addr1).approve(marketplace.address, 100000);
    await erc20.connect(addr2).approve(marketplace.address, 100000);

    //mint and approve erc721 nft
		console.log("before mint 1");
    await marketplace.connect(owner).mint721(owner.address, "/testURI_id1");
		console.log("mint 1");
    await marketplace.connect(owner).mint721(owner.address, "/testURI_id2");
    await erc721.connect(owner).approve(marketplace.address, 1);
    await erc721.connect(owner).approve(marketplace.address, 2);

    //mint and approve erc1155 nft
    // await marketplace.connect(creator).mint1155(creator.address, 3, 100, "0x");
    // await marketplace.connect(creator).mint1155(creator.address, 4, 100, "0x");
    // await erc1155.connect(creator).setApprovalForAll(marketplace.address, true);
  });

	it("Selling: Should list an item for sale", async function () {
		await marketplace.connect(owner).listItem(721, 1, 1, 100);
	});

	it("Selling: Should fail to list an item for sale (721 is non-fungible, setting more than 1 is impossible)", async function () {
		expect(await marketplace.connect(owner).listItem(721, 1, 2, 100)).to.be.revertedWith("721 is non-fungible, setting more than 1 is impossible");
	});

});