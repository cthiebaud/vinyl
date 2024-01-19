export const Symbols = (function () {

    return Object.freeze({
        _MODEL_LOADED_: Symbol('_MODEL_LOADED_'),
        _VIEW_LOADED_: Symbol('_VIEW_LOADED_'),
        _CLICKED_: Symbol('CLICKED_'),
        _START_: Symbol('START_'),
        _STOP_: Symbol('STOP_'),
        _NEXT_: Symbol('NEXT_'),
        _CREATE_MEDIA_PLAYER_: Symbol('CREATE_MEDIA_PLAYER_'),
        _DESTROY_MEDIA_PLAYER_: Symbol('DESTROY_MEDIA_PLAYER_'),

        _ONPLAY_: Symbol('ONPLAY_'),
        _ONPAUSE_: Symbol('ONPAUSE_'),
    })

})();
