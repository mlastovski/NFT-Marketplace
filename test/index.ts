import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

describe("Marketplace.sol", function () {
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
  const days = 86400;

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

    await marketplace.connect(owner).mint721(owner.address, "/id_1");
    await marketplace.connect(owner).mint721(owner.address, "/id_2");
    await erc721.connect(owner).approve(marketplace.address, 1);
    await erc721.connect(owner).approve(marketplace.address, 2);

    await marketplace.connect(owner).mint1155(owner.address, 3, 2000, "0x");
    await marketplace.connect(owner).mint1155(owner.address, 4, 2000, "0x");
    await erc1155.connect(owner).setApprovalForAll(marketplace.address, true);
  });

  describe("Selling functionality", function () {
    it("listItem: Should list a 721 item for sale", async function () {
      await marketplace.connect(owner).listItem(721, 1, 1, 100);
    });
  
    it("listItem: Should list 1155 items for sale", async function () {
      await marketplace.connect(owner).listItem(1155, 3, 10, 100);
    });
  
    it("listItem: Should fail to list 1155 items for sale (Insufficient balance)", async function () {
      await expect(marketplace.connect(owner).listItem(1155, 3, 1000000000000, 100)).to.be.revertedWith("Insufficient balance");
    });
  
    it("listItem: Should fail to list an item for sale (Not 1)", async function () {
      await expect(marketplace.connect(owner).listItem(721, 1, 2, 100)).to.be.revertedWith("Not 1");
    });
  
    it("listItem: Should fail to list an item for sale (Wrong standart)", async function () {
      await expect(marketplace.connect(owner).listItem(722, 1, 1, 100)).to.be.revertedWith("Wrong standart");
    });
  
    it("listItem: Should fail to list an item for sale (Must be at least 1 Wei)", async function () {
      await expect(marketplace.connect(owner).listItem(721, 1, 1, 0)).to.be.revertedWith("Must be at least 1 Wei");
    });
  
    it("listItem: Should fail to list an item for sale (Not an owner)", async function () {
      await expect(marketplace.connect(addr1).listItem(721, 1, 1, 100)).to.be.revertedWith("Not an owner");
    });
  
    it("buyItem: Should buy the 721 listed item", async function () {
      await marketplace.connect(owner).listItem(721, 1, 1, 100);
      await marketplace.connect(addr1).buyItem(1);
    });
  
    it("buyItem: Should buy the 1155 listed item", async function () {
      await marketplace.connect(owner).listItem(1155, 3, 10, 100);
      await marketplace.connect(addr1).buyItem(3);
    });
  
    it("buyItem: Should fail to buy the listed item (Nothing to buy)", async function () {
      await marketplace.connect(owner).listItem(721, 1, 1, 100);
      await marketplace.connect(addr1).buyItem(1);
      await expect(marketplace.connect(addr1).buyItem(1)).to.be.revertedWith("Nothing to buy");
    });
  
    it("cancel: Should cancel the selling of a 721 listed item", async function () {
      await marketplace.connect(owner).listItem(721, 1, 1, 100);
      await marketplace.connect(owner).cancel(1);
    });
  
    it("cancel: Should cancel the selling of a 1155 listed item", async function () {
      await marketplace.connect(owner).listItem(1155, 3, 10, 100);
      await marketplace.connect(owner).cancel(3);
    });
  
    it("cancel: Should fail to cancel the selling of an listed item (Nothing to cancel)", async function () {
      await marketplace.connect(owner).listItem(721, 1, 1, 100);
      await marketplace.connect(owner).cancel(1);
      await expect(marketplace.connect(owner).cancel(1)).to.be.revertedWith("Nothing to cancel");
    });
  
    it("cancel: Should fail to cancel the selling of an listed item (Not an owner)", async function () {
      await marketplace.connect(owner).listItem(721, 1, 1, 100);
      await expect(marketplace.connect(addr1).cancel(1)).to.be.revertedWith("Not an owner");
    });
  });

  describe("Auction functionality", function () {
    it("listItemOnAuction: Should list a 721 item", async function () {
      await marketplace.connect(owner).listItemOnAuction(721, 1, 1, 100);
    });
  
    it("listItemOnAuction: Should list a 1155 item", async function () {
      await marketplace.connect(owner).listItemOnAuction(1155, 3, 10, 1000);
    });
  
    it("listItemOnAuction: Should fail to list an item (Wrong standart)", async function () {
      await expect(marketplace.connect(owner).listItemOnAuction(1154, 3, 10, 1000)).to.be.revertedWith("Wrong standart");
    });
  
    it("listItemOnAuction: Should fail to list an item (Must be at least 1 Wei)", async function () {
      await expect(marketplace.connect(owner).listItemOnAuction(1155, 3, 10, 0)).to.be.revertedWith("Must be at least 1 Wei");
    });
  
    it("listItemOnAuction: Should fail to list a 721 item (Not 1)", async function () {
      await expect(marketplace.connect(owner).listItemOnAuction(721, 1, 10, 10)).to.be.revertedWith("Not 1");
    });
  
    it("listItemOnAuction: Should fail to list a 721 item (Not an owner)", async function () {
      await expect(marketplace.connect(addr1).listItemOnAuction(721, 1, 1, 10)).to.be.revertedWith("Not an owner");
    });
  
    it("listItemOnAuction: Should fail to list a 1155 item (Insufficient balance)", async function () {
      await expect(marketplace.connect(addr1).listItemOnAuction(1155, 3, 10000000000, 10)).to.be.revertedWith("Insufficient balance");
    });
  
    it("makeBid: Should make a bid", async function () {
      await marketplace.connect(owner).listItemOnAuction(721, 1, 1, 100);
      await marketplace.connect(addr1).makeBid(0, 200);
    });
  
    it("makeBid: Should fail to make a bid (No such lot)", async function () {
      await marketplace.connect(owner).listItemOnAuction(721, 1, 1, 100);
      await expect(marketplace.connect(addr1).makeBid(1, 200)).to.be.revertedWith("No such lot");
    });
  
    it("makeBid: Should fail to make a bid (Wrong amount)", async function () {
      await marketplace.connect(owner).listItemOnAuction(721, 1, 1, 100);
      await expect(marketplace.connect(addr1).makeBid(0, 100)).to.be.revertedWith("Wrong amount");
    });
  
    it("makeBid: Should fail to make a bid (Lot is outdated)", async function () {
      await marketplace.connect(owner).listItemOnAuction(721, 1, 1, 100);
      await ethers.provider.send('evm_increaseTime', [4 * days]);
      await ethers.provider.send('evm_mine', []);
      await expect(marketplace.connect(addr1).makeBid(0, 200)).to.be.revertedWith("Lot is outdated");
    });
  
    it("makeBid: Should transfer back previous highest bid", async function () {
      await marketplace.connect(owner).listItemOnAuction(721, 1, 1, 100);
      await marketplace.connect(addr1).makeBid(0, 200);
      await marketplace.connect(addr2).makeBid(0, 300);
    });
  
    it("finishAuction: Should finish (4 bids, 4 days)", async function () {
      await marketplace.connect(owner).listItemOnAuction(721, 1, 1, 100);
      await marketplace.connect(addr1).makeBid(0, 200);
      await marketplace.connect(addr2).makeBid(0, 300);
      await marketplace.connect(addr1).makeBid(0, 400);
      await marketplace.connect(addr2).makeBid(0, 500);
  
      await ethers.provider.send('evm_increaseTime', [4 * days]);
      await ethers.provider.send('evm_mine', []);
      
      await marketplace.connect(owner).finishAuction(0);
    });
  
    it("finishAuction: Should finish (0 bids, 4 days)", async function () {
      await marketplace.connect(owner).listItemOnAuction(721, 1, 1, 100);
  
      await ethers.provider.send('evm_increaseTime', [4 * days]);
      await ethers.provider.send('evm_mine', []);
      
      await marketplace.connect(owner).finishAuction(0);
    });
  
    it("finishAuction: Should finish (2 bids, 4 days)", async function () {
      await marketplace.connect(owner).listItemOnAuction(721, 1, 1, 100);
      await marketplace.connect(addr1).makeBid(0, 200);
      await marketplace.connect(addr2).makeBid(0, 300);
  
      await ethers.provider.send('evm_increaseTime', [4 * days]);
      await ethers.provider.send('evm_mine', []);
      
      await marketplace.connect(owner).finishAuction(0);
    });
  
    it("finishAuction: Should finish (2 bids, 4 days, 1155)", async function () {
      await marketplace.connect(owner).listItemOnAuction(1155, 3, 10, 100);
      await marketplace.connect(addr1).makeBid(0, 200);
      await marketplace.connect(addr2).makeBid(0, 300);
  
      await ethers.provider.send('evm_increaseTime', [4 * days]);
      await ethers.provider.send('evm_mine', []);
      
      await marketplace.connect(owner).finishAuction(0);
    });
  
    it("finishAuction: Should finish (4 bids, 4 days, 1155)", async function () {
      await marketplace.connect(owner).listItemOnAuction(1155, 3, 10, 100);
      await marketplace.connect(addr1).makeBid(0, 200);
      await marketplace.connect(addr2).makeBid(0, 300);
      await marketplace.connect(addr1).makeBid(0, 400);
      await marketplace.connect(addr2).makeBid(0, 500);
  
      await ethers.provider.send('evm_increaseTime', [4 * days]);
      await ethers.provider.send('evm_mine', []);
      
      await marketplace.connect(owner).finishAuction(0);
    });
  
    it("finishAuction: Should fail to finish (No such lot)", async function () {
      await marketplace.connect(owner).listItemOnAuction(1155, 3, 10, 100);
  
      await ethers.provider.send('evm_increaseTime', [4 * days]);
      await ethers.provider.send('evm_mine', []);
      
      await expect(marketplace.connect(owner).finishAuction(1)).to.be.revertedWith("No such lot");
    });
  
    it("finishAuction: Should fail to finish (Lot is outdated)", async function () {
      await marketplace.connect(owner).listItemOnAuction(1155, 3, 10, 100);
  
      await ethers.provider.send('evm_increaseTime', [4 * days]);
      await ethers.provider.send('evm_mine', []);
      
      await marketplace.connect(owner).finishAuction(0);
      await expect(marketplace.connect(owner).finishAuction(0)).to.be.revertedWith("Lot is outdated");
    });
  
    it("finishAuction: Should fail to finish (Wrong timestamp)", async function () {
      await marketplace.connect(owner).listItemOnAuction(1155, 3, 10, 100);
  
      await ethers.provider.send('evm_increaseTime', [2 * days]);
      await ethers.provider.send('evm_mine', []);
      
      await expect(marketplace.connect(owner).finishAuction(0)).to.be.revertedWith("Wrong timestamp");
    });
  
    it("getLotInfo: Should get lot info", async function () {
      await marketplace.connect(owner).listItemOnAuction(1155, 3, 10, 100);
      await marketplace.connect(addr1).makeBid(0, 200);
      await marketplace.connect(addr2).makeBid(0, 300);
      await marketplace.connect(addr1).makeBid(0, 400);
      await marketplace.connect(addr2).makeBid(0, 500);
  
      await ethers.provider.send('evm_increaseTime', [5 * days]);
      await ethers.provider.send('evm_mine', []);
      
      await marketplace.connect(owner).getLotInfo(0);
    });
  });

  it("onERC1155BatchReceived: Should return data", async function () {
    await erc1155.grantRole(erc1155.OWNER(), owner.address);
    await erc1155.connect(owner).mintBatch(owner.address, [3, 4], [2000, 2000], "0x");
    await erc1155.connect(owner).setApprovalForAll(marketplace.address, true);
    await erc1155.connect(owner).safeBatchTransferFrom(owner.address, marketplace.address, [3, 4], [2000, 2000], "0x");
  });

  describe("NFT721.sol", function () {
    it("tokenURI: Should return URI of a token", async function () {
      await erc721.connect(owner).tokenURI(1);
    });

    // it("supportsInterface: Should return interface id", async function () {
    //   // TODO
    // });
  });

  describe("NFT1155.sol", function () {
    it("uri: Should return URI of a token", async function () {
      await erc1155.connect(owner).uri(3);
    });

    // it("supportsInterface: Should return interface id", async function () {
    //   // TODO
    // });
  });

  describe("ERC20.sol", function () {
    it("name: Should return the name of a token", async function () {
      await erc20.connect(owner).name();
    });

    it("symbol: Should return the symbol of a token", async function () {
      await erc20.connect(owner).symbol();
    });

    it("decimals: Should return the decimals of a token", async function () {
      await erc20.connect(owner).decimals();
    });

    it("totalSupply: Should return the totalSupply of a token", async function () {
      await erc20.connect(owner).totalSupply();
    });

    it("balanceOf: Should return token balance for a given address", async function () {
      await erc20.connect(owner).balanceOf(owner.address);
    });

    it("burn: Should burn tokens", async function () {
      await erc20.connect(owner).mint(owner.address, 100);
      await erc20.connect(owner).burn(owner.address, 100);
    });

    it("burn: Should fail to burn tokens (Insufficient balance)", async function () {
      await expect(erc20.connect(owner).burn(owner.address, 100000000000)).to.be.revertedWith("Insufficient balance");
    });

    it("burn: Should fail to burn tokens (You are not an owner)", async function () {
      await expect(erc20.connect(addr1).burn(owner.address, 100000000000)).to.be.revertedWith("You are not an owner");
    });

    it("transfer: Should fail to transfer tokens (Insufficient balance)", async function () {
      await expect(erc20.connect(owner).transfer(addr1.address, 1000000000000000)).to.be.revertedWith("Insufficient balance");
    });

    it("transferFrom: Should fail to transferFrom tokens (Insufficient balance)", async function () {
      await expect(erc20.connect(owner).transferFrom(owner.address, addr1.address, 1000000000000000)).to.be.revertedWith("Insufficient balance");
    });

    it("transferFrom: Should fail to transferFrom tokens (Insufficient balance)", async function () {
      await erc20.connect(owner).approve(addr1.address, 1000000000000000);
      await expect(erc20.connect(owner).transferFrom(owner.address, addr1.address, 1000000000000000)).to.be.revertedWith("Insufficient balance");
    });

    it("transferFrom: Should fail to transferFrom tokens (Insufficient allowance)", async function () {
      await erc20.connect(owner).mint(owner.address, 1000000000000000);
      await expect(erc20.connect(owner).transferFrom(owner.address, addr1.address, 1000000000000000)).to.be.revertedWith("Insufficient allowance");
    });
  });
});
