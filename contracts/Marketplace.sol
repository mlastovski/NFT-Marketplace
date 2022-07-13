// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/AccessControl.sol";
// import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IERC721.sol";
// import "./interfaces/IERC1155.sol";
import "hardhat/console.sol";

contract Marketplace is AccessControl {
    IERC20 erc20;
    IERC721 nft721;
    
    struct ItemOnSale {
        uint256 standart;
        uint256 id;
        uint256 amount;
        address seller;
        address owner;
        uint256 price;
        bool listed;
    }

    // Mapping of NFTs that were set for sale 
    mapping(uint256 => ItemOnSale) _itemsOnSale;

    // Roles
    bytes32 public constant ADMIN = keccak256(abi.encodePacked("ADMIN"));
    bytes32 public constant OWNER = keccak256(abi.encodePacked("OWNER"));

    // Events
    event ListItem(uint256 _standart, uint256 _id, uint256 _amount, address _seller, address _owner, uint256 _price);
    event BuyItem(uint256 _standart, uint256 _id, uint256 _amount, address _seller, address _buyer, uint256 _price);
    event CancelItem(uint256 _standart, uint256 _id, uint256 _amount, address _seller, uint256 _price);


    constructor(address _erc20, address _nft721, address _owner) {
        _grantRole(ADMIN, msg.sender);
        _grantRole(OWNER, _owner);

        erc20 = IERC20(_erc20);
        nft721 = IERC721(_nft721);
    }

    function listItem(uint256 _standart, uint256 _id, uint256 _amount, uint256 _price) public {
        require(_standart == 721 || _standart == 1155);

        if (_standart == 721) {
            require(_amount == 1, "721 is non-fungible, setting more than 1 is impossible");
            require(_price > 0, "Price must be greater than 0");
            require(nft721.ownerOf(_id) == msg.sender);

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

            // bytes32 item = keccak256(abi.encodePacked(msg.sender, _standart, _id, _amount, _price));

            // require(!_itemsOnSale[item], "This item is already on sale now");
            // nft721.transferFrom(msg.sender, address(this), _id);
            // _itemsOnSale[item] = true;
        }

        emit ListItem(_standart, _id, _amount, msg.sender, address(this), _price);
    }

    function buyItem(uint256 _id) public {
        require(_itemsOnSale[_id].listed == true, "Nothing to buy");
        ItemOnSale storage nft = _itemsOnSale[_id];
        require(nft.standart == 721 || nft.standart == 1155);
        
        erc20.transferFrom(msg.sender, nft.seller, nft.price);

        if (nft.standart == 721) {
            nft721.safeTransferFrom(nft.owner, msg.sender, _id);
        }

        nft.listed = false;

        emit BuyItem(nft.standart, _id, nft.amount, nft.seller, msg.sender, nft.price);
    }

    function cancel(uint256 _id) public {
        require(_itemsOnSale[_id].listed == true, "Nothing to cancel");
        ItemOnSale storage nft = _itemsOnSale[_id];
        require(msg.sender == nft.seller, "You are not an owner of a selling lot");

        if (nft.standart == 721) {
            nft721.safeTransferFrom(nft.owner, msg.sender, _id);
        }

        nft.listed = false;

        emit CancelItem(nft.standart, _id, nft.amount, nft.seller, nft.price);
    }

    function mint721(address _to, string memory _tokenURI) public onlyRole(OWNER) {
        nft721.mint(_to, _tokenURI);
    }
}
