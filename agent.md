# StratPool - Agent Guide

## What is StratPool?

StratPool is a DeFi strategy marketplace that connects people who create trading strategies with investors who provide capital. Basically strategists can create strategy and post it on the app and then the investors comes with capital and posts their requirements and out strategy matching engine matches the best available strategy according to the investor's need. Then it creates the triggered based automation using ChainLink to execute the strategy on investor's deposited funds. Now the creator of the strategy earn comission on every profit making trades that has uses their strategy and that ratings of that strategy goes up, if any strategy is found to be loss making then the rating of it goes down and creator of that strategy earn no rewards.

- **Strategists** create and publish trading strategies.
- **Investors** deposit assets into vaults and choose strategies that match their requirements.
- **StratPool** matches investors with suitable strategies based on market preferences, risk, and compatibility.

## Core Product Rules

1. Investors can specify their preferred blockchain, trading type, and exact trading pair (e.g. ETH/USDC).
2. Strategists define the supported chain, trading pair, pool, accepted input assets, and strategy details.
3. Investors can see a strategy's description and relevant metrics, but never its internal strategy flow or node graph.
4. Exact duplicate strategies are not allowed.
5. The same strategy logic can be published for different trading pairs or pools.
6. Investors deposit assets into vaults. Their deposited asset must be compatible with the selected strategy - otherwise we will insist them to bridge it to the selected chain. 

Always inspect the existing codebase before introducing new dependencies or changing architecture.

## Development Guidelines

- Build features incrementally. Avoid implementing everything at once.
- Keep the code modular, readable, and type-safe.
- Reuse existing authentication, components, utilities, and design patterns.
- Validate all user input on the backend. Never trust frontend validation alone.
- Keep strategy execution logic and sensitive strategy definitions private.
- Do not expose internal strategy graphs through public APIs.
- Do not introduce blockchain integrations, vault execution, or unnecessary infrastructure unless explicitly requested.

## Architecture

- Frontend - Next.js
- Backend - Next backend
- Database - PostgreSQL
- Cache & Enquing - Redis
- Strategy Validator Engine - Validate a strategy when created
- Strategy Matching Engine - Matches the best strategy to use based on the investor's requirements
- Chain Link CRE - To set the trigger and automation for the execution of matched strategy
- StratPool Escrow and Vault Contracts - To maintain transparency with strategist about their comission when someone profits on their trade with their created strategy and vault contract to store deposits of inverstors.


## Working Style

Focus only on the feature currently requested. Make the smallest clean implementation, explain important decisions briefly, and avoid unrelated refactoring. Make sure the code quality is good. Also maintain a log of every requested features and what changes you did for that in plan.md - also try to be as minimal and simple and short as possible while maintaining the logs. If you have generated few code for a feature and you are requested to do something on top of that and if that change is not huge then don't create another log for that.

**Product principle:** StratPool connects trading intelligence with investment capital.