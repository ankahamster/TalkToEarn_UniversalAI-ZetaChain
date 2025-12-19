// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @dev 简化版 ERC721：仅支持 owner 铸造、URI 存储，其他操作走标准 ERC721 接口。
 * 兼容原有接口：mint(address to, string uri)，保留 onlyOwner 约束。
 */
contract SimpleMintOnlyNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId = 1;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {}

    /**
     * @dev 仅 owner 可铸造；tokenId 从 1 开始自增。
     */
    function mint(address to, string memory uri) public onlyOwner {
        require(to != address(0), "Mint to zero address");

        // tokenId 起始为 1
        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    // ERC721URIStorage 已提供 tokenURI；本合约不需要额外 override/burn。
}
