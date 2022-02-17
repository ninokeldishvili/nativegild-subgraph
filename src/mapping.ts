import { BigInt } from "@graphprotocol/graph-ts"
import {
  NativeGild,
  AltURI,
  Approval,
  ApprovalForAll,
  Construction as ConstructionEvent,
  Gild as GildTransfer,
  Transfer,
  TransferBatch,
  TransferSingle,
  URI,
  Ungild as UngildTransfer,
} from "../generated/NativeGild/NativeGild"
import { Gild, Ungild, Construction, Account, ERC20Transfer } from "../generated/schema"
import {
	fetchERC20,
	fetchERC20Approval,
  fetchERC20Balance
} from './fetch/erc20'

import {
	fetchAccount,
} from './fetch/account'

import {
	decimals,
  events, 
  transactions,
  constants
} from '@amxx/graphprotocol-utils'


export function handleAltURI(event: AltURI): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  // let entity = ExampleEntity.load(event.transaction.from.toHex())

  // // Entities only exist after they have been saved to the store;
  // // `null` checks allow to create entities on demand
  // if (!entity) {
  //   entity = new ExampleEntity(event.transaction.from.toHex())

  //   // Entity fields can be set using simple assignments
  //   entity.count = BigInt.fromI32(0)
  // }

  // // BigInt and BigDecimal math are supported
  // entity.count = entity.count + BigInt.fromI32(1)

  // // Entity fields can be set based on event parameters
  // entity.sender = event.params.sender
  // entity.altURI = event.params.altURI

  // // Entities can be written to the store with `.save()`
  // entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.allowance(...)
  // - contract.approve(...)
  // - contract.balanceOf(...)
  // - contract.balanceOf(...)
  // - contract.balanceOfBatch(...)
  // - contract.decimals(...)
  // - contract.decreaseAllowance(...)
  // - contract.increaseAllowance(...)
  // - contract.isApprovedForAll(...)
  // - contract.name(...)
  // - contract.supportsInterface(...)
  // - contract.symbol(...)
  // - contract.totalSupply(...)
  // - contract.transfer(...)
  // - contract.transferFrom(...)
  // - contract.uri(...)
}

export function handleApproval(event: Approval): void {
  let contract = fetchERC20(event.address)

	let owner           = fetchAccount(event.params.owner)
	let spender         = fetchAccount(event.params.spender)
	let approval        = fetchERC20Approval(contract, owner, spender)
	approval.valueExact = event.params.value
	approval.value      = decimals.toDecimals(event.params.value, contract.decimals)
	approval.save()
}

export function handleApprovalForAll(event: ApprovalForAll): void {}

export function handleConstruction(event: ConstructionEvent): void {
  let eve = Construction.load(event.transaction.hash.toHex())
  if (!eve) {
    eve = new Construction(event.transaction.from.toHex())
  }
  eve.price =    event.params.config.priceOracle
  eve.sender =   event.params.sender
  eve.name = event.params.config.name
  eve.symbol = event.params.config.symbol
  eve.uri = event.params.config.uri
  eve.erc20OverburnNumerator = event.params.config.erc20OverburnNumerator
  eve.erc20OverburnDenominator = event.params.config.erc20OverburnDenominator

  eve.save()
}

export function handleGild(event: GildTransfer): void {
  
  let entity = Gild.load(event.transaction.from.toHex())
  if (!entity) {
    entity = new Gild(event.transaction.from.toHex())
  }
  entity.sender = event.params.sender
  entity.amount =   event.params.amount
  entity.price =   event.params.price

  entity.save()
}

export function handleTransfer(event: Transfer): void {
  let contract   = fetchERC20(event.address)
	let ev         = new ERC20Transfer(events.id(event))
	ev.emitter     = contract.id
	ev.transaction = transactions.log(event).id
	ev.timestamp   = event.block.timestamp
	ev.contract    = contract.id
	ev.value       = decimals.toDecimals(event.params.value, contract.decimals)
	ev.valueExact  = event.params.value

	if (event.params.from.toHex() == constants.ADDRESS_ZERO) {
		let totalSupply        = fetchERC20Balance(contract, null)
		totalSupply.valueExact = totalSupply.valueExact.plus(event.params.value)
		totalSupply.value      = decimals.toDecimals(totalSupply.valueExact, contract.decimals)
		totalSupply.save()
	} else {
		let from               = fetchAccount(event.params.from)
		let balance            = fetchERC20Balance(contract, from)
		balance.valueExact     = balance.valueExact.minus(event.params.value)
		balance.value          = decimals.toDecimals(balance.valueExact, contract.decimals)
		balance.save()

		ev.from                = from.id
		ev.fromBalance         = balance.id
	}

	if (event.params.to.toHex() == constants.ADDRESS_ZERO) {
		let totalSupply        = fetchERC20Balance(contract, null)
		totalSupply.valueExact = totalSupply.valueExact.minus(event.params.value)
		totalSupply.value      = decimals.toDecimals(totalSupply.valueExact, contract.decimals)
		totalSupply.save()
	} else {
		let to                 = fetchAccount(event.params.to)
		let balance            = fetchERC20Balance(contract, to)
		balance.valueExact     = balance.valueExact.plus(event.params.value)
		balance.value          = decimals.toDecimals(balance.valueExact, contract.decimals)
		balance.save()

		ev.to                  = to.id
		ev.toBalance           = balance.id
	}
	ev.save()
}

export function handleTransferBatch(event: TransferBatch): void {}

export function handleTransferSingle(event: TransferSingle): void {}

export function handleURI(event: URI): void {}

export function handleUngild(event: UngildTransfer): void {
    
  let entity = Ungild.load(event.transaction.from.toHex())
  if (!entity) {
    entity = new Ungild(event.transaction.from.toHex())
  }

  entity.sender = event.params.sender
  entity.amount =   event.params.amount
  entity.price =   event.params.price

  entity.save()
}
