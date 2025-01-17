import { LightningElement, api, track } from 'lwc';

const CSS_CLASS = 'modal-hidden';

export default class Modal extends LightningElement {
    @api showCloseButton = false;

    @api
    set header(value) {
        this.hasHeaderString = value !== '';
        this._headerPrivate = value;
    }

    get header() {
        return this._headerPrivate;
    }

    @track hasHeaderString = false;
    @track _modalStyles = '';
    _headerPrivate;

    @api show() {
        const outerDivEl = this.template.querySelector('div');
        outerDivEl.classList.remove(CSS_CLASS);
    }

    @api hide() {
        const outerDivEl = this.template.querySelector('div');
        outerDivEl.classList.add(CSS_CLASS);
    }

    @api overrideModalContStyles(css) {
        this._modalContStyles = css;
    }

    handleDialogClose() {
        this.hide();
    }

    handleSlotTaglineChange() {
        const taglineEl = this.template.querySelector('p');
        taglineEl.classList.remove(CSS_CLASS);
    }

    handleSlotFooterChange() {
        const footerEl = this.template.querySelector('footer');
        footerEl.classList.remove(CSS_CLASS);
    }
}