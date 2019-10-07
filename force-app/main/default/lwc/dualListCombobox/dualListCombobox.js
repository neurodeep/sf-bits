/**
 * Created by @author mmorozov on 07/15/2019.
 */

import {LightningElement, api, track, wire} from 'lwc';
import {getObjectInfo, getPicklistValues} from 'lightning/uiObjectInfoApi';
import getLookupValues from '@salesforce/apex/UiObjectInfoApi.getLookupValues';
import {label as labels} from 'c/constants';

const DELAY = 1000;

export default class DualListCombobox extends LightningElement {
    @api name;
    @api label;
    @api value = '';
    @api options = [];
    @api selected = [];
    @api objectApiName;
    @api fieldApiName;
    @api getter;

    @track displayValue = '';
    @track filter = '';

    @wire(getObjectInfo, {objectApiName: '$objectApiName'})
    objectInfo;

    @wire(getPicklistValues, {recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: '$fieldApiName'})
    picklistWire({data}) {
        if (data && data.values) {
            this.options = data.values;
        }
    }

    @api
    clear() {
        this.value = '';
        this.displayValue = '';
        this.filter = '';
        this.selected = [];
        this.dispatchEvent(new CustomEvent('change'));
    }

    constructor() {
        super();
        this.labels = labels;
    }

    connectedCallback() {
        if (!this.objectApiName && this.fieldApiName) {
            this.isLookup = true;
            this.getLookupOptions();
        }

        if (this.getter) {
            this.isLookup = true;
            this.getter().then(data => {
                this.options = data;
            });
        }

        if (this.options.length > 0 && this.options[0].value !== this.options[0].label) {
            this.isLookup = true;
        }
    }

    renderedCallback() {
        if (!this.isRendered) {
            this.isRendered = true;
            this.modal = this.template.querySelector('c-modal');
        }
    }

    onSearch(event) {
        this.filter = event.target.value;

        if (this.filter.length === 0 || this.filter.length > 2) {
            // TODO: Apex call in case we decide to limit initial search somehow, e.g., require isFullSearch.
            // Also add show-activity-indicator to lightning-dual-listbox
            // if (!this.objectApiName && this.fieldApiName && this.isFullSearch) {
            //     this.debouncedSearch(event);
            // } else {

            // Filter stored options on each search.
            this.options = this._options.filter(option => {
                return option.label.toLowerCase().includes(this.filter.toLowerCase());
            });
        }
    }

    debouncedSearch(event) {
        // Debouncing this method: Do not update the reactive property as long as this function is
        // being called within a delay of DELAY. This is to avoid a very large number of Apex method calls.
        window.clearTimeout(this.delayTimeout);
        this.delayTimeout = setTimeout(() => {
            this.filter = event.target.value;
            this.getLookupOptions();
        }, DELAY);
    }

    onChange(event) {
        this.selected = event.detail.value;
    }

    onShowModal(event) {
        if (event.target.value !== this.displayValue) { // Input was cleared.
            this.clear();
        } else {
            // Store available and selected options.
            this._options = [...this.options];
            this._selected = [...this.selected];

            this.modal.show();
        }

        event.target.blur();
    }

    onCancel() {
        this.selected = [...this._selected]; // Revert selected options.
        this.closeModal();
    }

    onSave() {
        this.value = this.selected.join(';');
        this.displayValue = this.joinSelected();
        this.dispatchEvent(new CustomEvent('change'));
        this.closeModal();
    }

    /* Service */

    /**
     * @wire cannot be used conditionally, so lets call this imperatively.
     * getObjectInfo and getPicklistValues can be called only with @wire, so we can add them here for consistency.
     */
    getLookupOptions() {
        getLookupValues({
            fieldInfo: this.fieldApiName,
            // filter: this.filter
        }).then(data => {
            this.options = data.values;
        });
    }

    joinSelected() {
        let result = [];

        if (this.isLookup) {
            for (const option of this.options) {
                if (this.selected.includes(option.value)) {
                    result.push(option.label)
                }
            }
        } else {
            result = this.selected;
        }

        return result.join(', ');
    }

    closeModal() {
        this.filter = ''; // Clear filter
        this.options = [...this._options]; // Restore options.
        this.modal.hide();
    }
}