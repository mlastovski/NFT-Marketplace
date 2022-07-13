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
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

		ERC20Factory = await ethers.getContractFactory("ERC20");
		erc20 = await ERC20Factory.deploy("ShitCoin", "SHT", 18);
		await erc20.deployed();

    ERC721Factory = await ethers.getContractFactory("NFT721");
    erc721 = await ERC721Factory.deploy();
    await erc721.deployed();

    ERC1155Factory = await ethers.getContractFactory("NFT1155");
    erc1155 = await ERC1155Factory.deploy();
    await erc1155.deployed();

    MarketplaceFactory = await ethers.getContractFactory("Marketplace");
    marketplace = await MarketplaceFactory.deploy(erc20.address, erc721.address, erc1155.address);
    await marketplace.deployed();

    await erc721.grantRole(erc721.OWNER(), marketplace.address);
    await erc1155.grantRole(erc1155.OWNER(), marketplace.address);

    await erc20.mint(addr1.address, 200000);
    await erc20.mint(addr2.address, 200000);
    await erc20.connect(addr1).approve(marketplace.address, 200000);
    await erc20.connect(addr2).approve(marketplace.address, 200000);

    await marketplace.connect(owner).mint721(owner.address, "/testURI_id1");
    await marketplace.connect(owner).mint721(owner.address, "/testURI_id2");
    await erc721.connect(owner).approve(marketplace.address, 1);
    await erc721.connect(owner).approve(marketplace.address, 2);

    await marketplace.connect(owner).mint1155(owner.address, 3, 2000, "0x");
    await marketplace.connect(owner).mint1155(owner.address, 4, 2000, "0x");
    await erc1155.connect(owner).setApprovalForAll(marketplace.address, true);
  });

	it("Selling (Listing function): Should list an item for sale", async function () {
		await marketplace.connect(owner).listItem(721, 1, 1, 100);
	});

	it("Selling (Listing function): Should fail to list an item for sale (Not 1)", async function () {
		await expect(marketplace.connect(owner).listItem(721, 1, 2, 100)).to.be.revertedWith("Not 1");
	});

	it("Selling (Listing function): Should fail to list an item for sale (Wrong standart)", async function () {
		await expect(marketplace.connect(owner).listItem(722, 1, 1, 100)).to.be.revertedWith("Wrong standart");
	});

  it("Selling (Listing function): Should fail to list an item for sale (Must be at least 1 Wei)", async function () {
		await expect(marketplace.connect(owner).listItem(721, 1, 1, 0)).to.be.revertedWith("Must be at least 1 Wei");
	});

  it("Selling (Listing function): Should fail to list an item for sale (Not an owner)", async function () {
		await expect(marketplace.connect(addr1).listItem(721, 1, 1, 100)).to.be.revertedWith("Not an owner");
	});

  it("Selling (Buy function): Should buy the listed item", async function () {
    await marketplace.connect(owner).listItem(721, 1, 1, 100);
    await marketplace.connect(addr1).buyItem(1);
  });

  it("Selling (Buy function): Should fail to buy the listed item (Nothing to buy)", async function () {
    await marketplace.connect(owner).listItem(721, 1, 1, 100);
    await marketplace.connect(addr1).buyItem(1);
    await expect(marketplace.connect(addr1).buyItem(1)).to.be.revertedWith("Nothing to buy");
  });

  it("Selling (Cancel function): Should cancel the selling of an listed item", async function () {
    await marketplace.connect(owner).listItem(721, 1, 1, 100);
    await marketplace.connect(owner).cancel(1);
  });

  it("Selling (Cancel function): Should fail to cancel the selling of an listed item (Nothing to cancel)", async function () {
    await marketplace.connect(owner).listItem(721, 1, 1, 100);
    await marketplace.connect(owner).cancel(1);
    await expect(marketplace.connect(owner).cancel(1)).to.be.revertedWith("Nothing to cancel");
  });

  it("Selling (Cancel function): Should fail to cancel the selling of an listed item (Not an owner)", async function () {
    await marketplace.connect(owner).listItem(721, 1, 1, 100);
    await expect(marketplace.connect(addr1).cancel(1)).to.be.revertedWith("Not an owner");
  });

  it("Selling (Info function): Should get listing info", async function () {
    await marketplace.connect(owner).listItem(721, 1, 1, 100);
    const info = await marketplace.connect(owner).getListingInfo(1);
    console.log(info);
  });
});
