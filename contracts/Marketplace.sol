// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IERC721.sol";
import "./interfaces/IERC1155.sol";

contract Marketplace is AccessControl {
    IERC20 erc20;
    IERC721 nft721;
    IERC1155 nft1155;

    // Auction variables
    uint256 public lotActiveTime = 3 days;
    uint256 public minimalBidsQuantity = 3;
    
    // Struct of an item on sale
    struct ItemOnSale {
        uint256 standart;
        uint256 id;
        uint256 amount;
        address seller;
        address owner;
        uint256 price;
        bool listed;
    }

    // Struct of an item on auction
    struct ItemOnAuction {
        uint256 standart;
        uint256 id;
        uint256 amount;
        address seller;
        uint256 startingTime;
        uint256 startingPrice;
        uint256 bidsQuantity;
        uint256 winningBid;
        address winningAddress;
        bool complete;
    }

    // Array of auctions
    ItemOnAuction[] public _itemsOnAuction;

    // Mapping of NFTs that were set for sale 
    mapping(uint256 => ItemOnSale) _itemsOnSale;

    // Roles
    bytes32 public constant OWNER = keccak256(abi.encodePacked("OWNER"));

    // Events for selling functionality
    event ListItem(uint256 _standart, uint256 _id, uint256 _amount, address _seller, address _owner, uint256 _price);
    event BuyItem(uint256 _standart, uint256 _id, uint256 _amount, address _seller, address _buyer, uint256 _price);
    event CancelItem(uint256 _standart, uint256 _id, uint256 _amount, address _seller, uint256 _price);

    // Events for auction functionality
    event ListItemOnAuction(uint256 _index, uint256 _standart, uint256 _id, uint256 _amount, address _seller, uint256 _startingPrice);
    event MakeBid(uint256 _id, uint256 _amount, address _from);
    event AuctionFinished(uint256 _index, uint256 _standart, uint256 _id, uint256 _amount, address _seller, uint256 _startingPrice, address _winner, uint256 _winningPrice, uint256 _bidsQuantity);

    constructor(address _erc20, address _erc721, address _erc1155) {
        _grantRole(OWNER, msg.sender);

        erc20 = IERC20(_erc20);
        nft721 = IERC721(_erc721);
        nft1155 = IERC1155(_erc1155);
    }

    function listItem(uint256 _standart, uint256 _id, uint256 _amount, uint256 _price) public {
        require(_standart == 721 || _standart == 1155, "Wrong standart");
        require(_price > 0, "Must be at least 1 Wei");

        if (_standart == 721) {
            require(_amount == 1, "Not 1");
            require(nft721.ownerOf(_id) == msg.sender, "Not an owner");
            nft721.transferFrom(msg.sender, address(this), _id);

            _itemsOnSale[_id] = ItemOnSale(
                _standart,
                _id,
                1,
                msg.sender,
                address(this),
                _price,
                true
            );
        } else {
            require(nft1155.balanceOf(msg.sender, _id) >= _amount, "Insufficient balance");
            nft1155.safeTransferFrom(msg.sender, address(this), _id, _amount, "");
            
            _itemsOnSale[_id] = ItemOnSale(
                _standart,
                _id,
                _amount,
                msg.sender,
                address(this),
                _price,
                true
            );
        }

        emit ListItem(_standart, _id, _amount, msg.sender, address(this), _price);
    }

    function buyItem(uint256 _id) public {
        require(_itemsOnSale[_id].listed == true, "Nothing to buy");
        ItemOnSale storage nft = _itemsOnSale[_id];
        
        erc20.transferFrom(msg.sender, nft.seller, nft.price);

        if (nft.standart == 721) {
            nft721.safeTransferFrom(nft.owner, msg.sender, _id);
        } else {
            nft1155.safeTransferFrom(nft.owner, msg.sender, _id, nft.amount, "");
        }

        nft.listed = false;

        emit BuyItem(nft.standart, _id, nft.amount, nft.seller, msg.sender, nft.price);
    }

    function cancel(uint256 _id) public {
        require(_itemsOnSale[_id].listed == true, "Nothing to cancel");
        ItemOnSale storage nft = _itemsOnSale[_id];
        require(msg.sender == nft.seller, "Not an owner");

        if (nft.standart == 721) {
            nft721.safeTransferFrom(nft.owner, msg.sender, _id);
        } else {
            nft1155.safeTransferFrom(nft.owner, msg.sender, _id, nft.amount, "");
        }

        nft.listed = false;

        emit CancelItem(nft.standart, _id, nft.amount, nft.seller, nft.price);
    }

    function listItemOnAuction(uint256 _standart, uint256 _id, uint256 _amount, uint256 _startingPrice) public {
        require(_standart == 721 || _standart == 1155, "Wrong standart");
        require(_startingPrice > 0, "Must be at least 1 Wei");
        
        if (_standart == 721) {
            require(_amount == 1, "Not 1");
            require(nft721.ownerOf(_id) == msg.sender, "Not an owner");
            nft721.transferFrom(msg.sender, address(this), _id);
        } else {
            require(nft1155.balanceOf(msg.sender, _id) >= _amount, "Insufficient balance");
            nft1155.safeTransferFrom(msg.sender, address(this), _id, _amount, "");
        }

        _itemsOnAuction.push(
            ItemOnAuction(
                _standart, 
                _id, 
                _amount, 
                msg.sender, 
                uint256(block.timestamp), 
                _startingPrice, 
                0, 
                _startingPrice, 
                address(0), 
                false)
        );  

        uint256 lotIndex = _itemsOnAuction.length - 1;   

        emit ListItemOnAuction(lotIndex, _standart, _id, _amount, msg.sender, _startingPrice);   
    }

    function makeBid(uint256 _id, uint256 _amount) public {
        require(_itemsOnAuction.length > _id, "No such lot");
        ItemOnAuction storage lot = _itemsOnAuction[_id];
        require(lot.startingTime + lotActiveTime > block.timestamp, "Lot is outdated");
        require(_amount > lot.winningBid, "Wrong amount");

        erc20.transferFrom(msg.sender, address(this), _amount);

        if (lot.winningAddress != address(0)) {
            erc20.transfer(lot.winningAddress, lot.winningBid);
        }

        lot.winningBid = _amount;
        lot.winningAddress = msg.sender;
        lot.bidsQuantity += 1;

        emit MakeBid(_id, _amount, msg.sender);
    }

    function finishAuction(uint256 _id) public {
        require(_itemsOnAuction.length > _id, "No such lot");
        ItemOnAuction storage lot = _itemsOnAuction[_id];
        require(!lot.complete, "Lot is outdated");
        require(lot.startingTime + lotActiveTime <= block.timestamp, "Wrong timestamp");

        lot.complete = true;

        if (lot.bidsQuantity <= minimalBidsQuantity) {
            if (lot.winningAddress != address(0)) {
                erc20.transfer(lot.winningAddress, lot.winningBid);
                lot.winningAddress = address(0);
            }

            if (lot.standart == 721) {
                nft721.transferFrom(address(this), lot.seller, lot.id);
            } else {
                nft1155.safeTransferFrom(address(this), lot.seller, lot.id, lot.amount, "");
            }

        } else {
            erc20.transfer(lot.seller, lot.winningBid);

            if (lot.standart == 721) {
                nft721.transferFrom(address(this), lot.winningAddress, lot.id);
            } else {
                nft1155.safeTransferFrom(address(this), lot.winningAddress, lot.id, lot.amount, "");
            }
        }

        emit AuctionFinished(_id, lot.standart, lot.id, lot.amount, lot.seller, lot.startingPrice, lot.winningAddress, lot.winningBid, lot.bidsQuantity); 
    }

    function mint721(address _to, string memory _tokenURI) public onlyRole(OWNER) {
        nft721.mint(_to, _tokenURI);
    }

    function mint1155(address _to, uint256 _id, uint256 _amount, bytes memory _data) public onlyRole(OWNER) {
        nft1155.mint(_to, _id, _amount, _data);
    }

    function getListingInfo(uint256 _id) public view returns (uint256, uint256, uint256, address, address, uint256, bool) {
        return(
            _itemsOnSale[_id].standart, 
            _itemsOnSale[_id].id, 
            _itemsOnSale[_id].amount, 
            _itemsOnSale[_id].seller, 
            _itemsOnSale[_id].owner, 
            _itemsOnSale[_id].price, 
            _itemsOnSale[_id].listed
        );
    }

    function getLotInfo(uint256 _id) public view returns (ItemOnAuction memory lot) {
        return _itemsOnAuction[_id];
    }
}
