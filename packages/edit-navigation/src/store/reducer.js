/**
 * External dependencies
 */
import { invert } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

function mappings( state, { type, ...action } ) {
	if ( type === 'SET_MENU_ITEMS_TO_CLIENT_ID_MAPPING' ) {
		const { mapping } = action;
		return {
			menuItemIdByClientId: mapping,
			clientIdByMenuItemId: invert( mapping ),
		};
	}

	if ( type === 'ASSIGN_MENU_ITEM_ID_TO_CLIENT_ID' ) {
		const { menuItemId, clientId } = action;
		const menuItemIdByClientId = {
			...state.menuItemIdByClientId,
			[ menuItemId ]: clientId,
		};
		return {
			...state,
			menuItemIdByClientId,
			clientIdByMenuItemId: invert( menuItemIdByClientId ),
		};
	}

	return state || {};
}

export default combineReducers( {
	mappings,
} );
