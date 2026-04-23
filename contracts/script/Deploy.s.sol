// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MyPredictionMarket.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("CRE_ETH_PRIVATE_KEY");
        address oracleAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        MyPredictionMarket market = new MyPredictionMarket(oracleAddress);

        vm.stopBroadcast();

        console.log("MyPredictionMarket deployed to:", address(market));
        console.log("Oracle address set to:", oracleAddress);
    }
}
