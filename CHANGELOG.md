# Changelog
All notable changes to this project will be documented in this file.

## [1.0.1] - 2021-09-07

### Added

### Changed
- Error Handling. Now error returs a 200 status with {status: 'failed', error: 'Reason'}.
- Collections are Now Contracts. Also endpoints and Id have changed /contracts and contractId instead of collectionId.

### Added
- (experimental). You can add an ERC20 contract by specifying erc: 20 when adding a contract.
- Transfer to a regular address is also possible. {to: 0, address: '0x....'}
