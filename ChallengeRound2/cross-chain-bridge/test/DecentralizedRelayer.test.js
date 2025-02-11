const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("DecentralizedRelayer", function () {
    let decentralizedRelayer;
    let owner;
    let relayer;
    let user;
    let target;
  
    beforeEach(async function () {
      [owner, relayer, user, target] = await ethers.getSigners();
  
      const DecentralizedRelayer = await ethers.getContractFactory("DecentralizedRelayer");
      decentralizedRelayer = await DecentralizedRelayer.deploy();
      await decentralizedRelayer.waitForDeployment();
  
      // Authorize relayer
      await decentralizedRelayer.updateRelayer(relayer.address, true);
    });
  
    describe("Transaction relay", function () {
      it("Should relay transaction with valid signature", async function () {
        const nonce = await decentralizedRelayer.nonces(user.address);
        const data = "0x12345678";
        
        const message = ethers.utils.keccak256(
          ["address", "address", "bytes", "uint256", "address"],
          [user.address, target.address, data, nonce, decentralizedRelayer.address]
        );
        
        const signature = await user.signMessage(ethers.utils.arrayify(message));
  
        await expect(
          decentralizedRelayer.connect(relayer).relayTransaction(
            user.address,
            target.address,
            data,
            nonce,
            signature
          )
        ).to.emit(decentralizedRelayer, "TransactionRelayed")
         .withArgs(user.address, target.address, data, nonce);
      });
  
      it("Should reject unauthorized relayer", async function () {
        await expect(
          decentralizedRelayer.connect(user).relayTransaction(
            user.address,
            target.address,
            "0x",
            0,
            "0x"
          )
        ).to.be.revertedWith("Unauthorized relayer");
      });
  
      it("Should reject invalid nonce", async function () {
        const invalidNonce = 999;
        
        await expect(
          decentralizedRelayer.connect(relayer).relayTransaction(
            user.address,
            target.address,
            "0x",
            invalidNonce,
            "0x"
          )
        ).to.be.revertedWith("Invalid nonce");
      });
    });
  });