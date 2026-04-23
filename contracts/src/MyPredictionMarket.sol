// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MyPredictionMarket
/// @notice A standalone prediction market contract without Chainlink CRE.
contract MyPredictionMarket {
    error MarketDoesNotExist();
    error MarketNotExpired();
    error MarketAlreadySettled();
    error MarketNotSettled();
    error AlreadyPredicted();
    error InvalidAmount();
    error NothingToClaim();
    error AlreadyClaimed();
    error TransferFailed();
    error OnlyOracle();

    event MarketCreated(uint256 indexed marketId, string question, uint48 expiresAt, address creator);
    event PredictionMade(uint256 indexed marketId, address indexed predictor, Prediction prediction, uint256 amount);
    event SettlementRequested(uint256 indexed marketId, string question); // Can be used by oracle to trigger
    event MarketSettled(uint256 indexed marketId, Prediction outcome);
    event WinningsClaimed(uint256 indexed marketId, address indexed claimer, uint256 amount);

    enum Prediction {
        Yes,
        No
    }

    struct Market {
        address creator;
        uint48 createdAt;
        uint48 expiresAt;
        uint48 settledAt;
        bool settled;
        Prediction outcome;
        uint256 totalYesPool;
        uint256 totalNoPool;
        string question;
    }

    struct UserPrediction {
        uint256 amount;
        Prediction prediction;
        bool claimed;
    }

    uint256 public nextMarketId;
    address public oracle; // The designated single-node oracle address

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => UserPrediction)) public predictions;

    modifier onlyOracle() {
        if (msg.sender != oracle) revert OnlyOracle();
        _;
    }

    constructor(address _oracle) {
        oracle = _oracle;
    }

    /// @notice Create a new prediction market.
    /// @param question The question for the market.
    /// @param expiresAt The timestamp when the market expires and can be settled.
    /// @return marketId The ID of the newly created market.
    function createMarket(string memory question, uint48 expiresAt) public returns (uint256 marketId) {
        marketId = nextMarketId++;

        markets[marketId] = Market({
            creator: msg.sender,
            createdAt: uint48(block.timestamp),
            expiresAt: expiresAt,
            settledAt: 0,
            settled: false,
            outcome: Prediction.Yes,
            totalYesPool: 0,
            totalNoPool: 0,
            question: question
        });

        emit MarketCreated(marketId, question, expiresAt, msg.sender);
    }

    /// @notice Make a prediction on a market.
    function predict(uint256 marketId, Prediction prediction) external payable {
        Market storage m = markets[marketId];

        if (m.creator == address(0)) revert MarketDoesNotExist();
        if (m.settled) revert MarketAlreadySettled();
        if (block.timestamp >= m.expiresAt) revert MarketAlreadySettled(); // Cannot predict after expiration
        if (msg.value == 0) revert InvalidAmount();

        UserPrediction storage userPred = predictions[marketId][msg.sender];
        if (userPred.amount != 0) revert AlreadyPredicted();

        userPred.amount = msg.value;
        userPred.prediction = prediction;
        userPred.claimed = false;

        if (prediction == Prediction.Yes) {
            m.totalYesPool += msg.value;
        } else {
            m.totalNoPool += msg.value;
        }

        emit PredictionMade(marketId, msg.sender, prediction, msg.value);
    }

    /// @notice Settle the market by the designated oracle.
    function settleMarket(uint256 marketId, Prediction outcome) external onlyOracle {
        Market storage m = markets[marketId];

        if (m.creator == address(0)) revert MarketDoesNotExist();
        if (m.settled) revert MarketAlreadySettled();
        if (block.timestamp < m.expiresAt) revert MarketNotExpired();

        m.settled = true;
        m.settledAt = uint48(block.timestamp);
        m.outcome = outcome;

        emit MarketSettled(marketId, outcome);
    }

    /// @notice Request settlement (optional trigger for the oracle)
    function requestSettlement(uint256 marketId) external {
        Market storage m = markets[marketId];
        if (m.creator == address(0)) revert MarketDoesNotExist();
        if (m.settled) revert MarketAlreadySettled();
        if (block.timestamp < m.expiresAt) revert MarketNotExpired();
        
        emit SettlementRequested(marketId, m.question);
    }

    /// @notice Claim winnings after market settlement.
    function claim(uint256 marketId) external {
        Market storage m = markets[marketId];

        if (m.creator == address(0)) revert MarketDoesNotExist();
        if (!m.settled) revert MarketNotSettled();

        UserPrediction storage userPred = predictions[marketId][msg.sender];

        if (userPred.amount == 0) revert NothingToClaim();
        if (userPred.claimed) revert AlreadyClaimed();
        if (userPred.prediction != m.outcome) revert NothingToClaim();

        userPred.claimed = true;

        uint256 totalPool = m.totalYesPool + m.totalNoPool;
        uint256 winningPool = m.outcome == Prediction.Yes ? m.totalYesPool : m.totalNoPool;
        
        uint256 payout = 0;
        if (winningPool > 0) {
            payout = (userPred.amount * totalPool) / winningPool;
        }

        if (payout > 0) {
            (bool success,) = msg.sender.call{value: payout}("");
            if (!success) revert TransferFailed();
            emit WinningsClaimed(marketId, msg.sender, payout);
        }
    }
}
