// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract NFT1155 is ERC1155, AccessControl {
    string public name = "Smileys";
    string public symbol = "SMLS";
    bytes32 public constant OWNER = keccak256(abi.encodePacked("OWNER"));

    constructor() ERC1155("ipfs://bafybeibluxooouekfbn6l535gp5asupnjkbdfb7ekryglkq5txflxwodca/{id}.json") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address _to, uint256 _id, uint256 _amount, bytes memory _data) public onlyRole(OWNER) {
        _mint(_to, _id, _amount, _data);
    }

    function mintBatch(address _to, uint256[] memory _id, uint256[] memory _amount, bytes memory _data) public onlyRole(OWNER) {
        _mintBatch(_to, _id, _amount, _data);
    }

    function uri(uint256 _id) override public pure returns (string memory) {
        return string(
            abi.encodePacked(
                "https://ipfs.io/ipfs/bafybeibluxooouekfbn6l535gp5asupnjkbdfb7ekryglkq5txflxwodca/",
                Strings.toString(_id),".json"
            )
        );
    }

    function supportsInterface(bytes4 interfaceId) public view override (AccessControl, ERC1155) returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }
}