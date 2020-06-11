/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useRef, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { flattenBlocks } from './helpers';
import PromiseQueue from './promise-queue';

/**
 * When a new Navigation child block is added, we create a draft menuItem for it because
 * the batch save endpoint expects all the menu items to have a valid id already.
 * PromiseQueue is used in order to
 * 1) limit the amount of requests processed at the same time
 * 2) save the menu only after all requests are finalized
 *
 * @return {function(*=): void} Function registering it's argument to be called once all menuItems are created.
 */
export default function useCreateMissingMenuItems() {
	const promiseQueueRef = useRef( new PromiseQueue( 5 ) );
	const processedClientIds = useRef( [] );
	const { assignMenuItemIdToClientId } = useDispatch(
		'core/edit-navigation'
	);

	const createMissingMenuItems = useCallback(
		( previousBlocks, newBlocks ) => {
			const existingClientIds = flattenBlocks( previousBlocks ).map(
				( { clientId } ) => clientId
			);
			for ( const { clientId, name } of flattenBlocks( newBlocks ) ) {
				// No need to create menuItems for the wrapping navigation block
				if ( name === 'core/navigation' ) {
					continue;
				}
				// Menu item was already created
				if ( existingClientIds.includes( clientId ) ) {
					continue;
				}
				// Menu item already processed
				if ( processedClientIds.current.includes( clientId ) ) {
					continue;
				}
				processedClientIds.current.push( clientId );
				promiseQueueRef.current.enqueue( () =>
					createDraftMenuItem( clientId ).then( ( menuItem ) => {
						assignMenuItemIdToClientId( clientId, menuItem.id );
					} )
				);
			}
		}
	);
	const onCreated = useCallback(
		( callback ) => promiseQueueRef.current.then( callback ),
		[ promiseQueueRef.current ]
	);
	return { createMissingMenuItems, onCreated };
}

function createDraftMenuItem() {
	return apiFetch( {
		path: `/__experimental/menu-items`,
		method: 'POST',
		data: {
			title: 'Placeholder',
			url: 'Placeholder',
			menu_order: 0,
		},
	} );
}
