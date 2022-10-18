document.addEventListener("DOMContentLoaded", function() {
    'use strict';
    new DkGantt();
});

function DkGantt() {
    'use strict';
    var start_day = new Date();
    var min_days_visible = 60;
    var nb_days_visible = 20;
    var $editor = document.getElementById('gantt-editor');
    var $editor_wrapper = document.getElementById('gantt-editor__wrapper');
    var $header = document.getElementById('gantt-header');
    var $lines = document.getElementById('gantt-lines');
    var _templates = {
        header_date: document.getElementById('tpl-header-date').innerHTML,
        editor_line: document.getElementById('tpl-editor-line').innerHTML,
        line: document.getElementById('tpl-line').innerHTML,
    };

    function init() {
        build_editor();
        editor_insert_initial_lines();
        build_tasks_lines();
        build_header_dates();
    }

    /* ----------------------------------------------------------
      Editor
    ---------------------------------------------------------- */

    /* Init
    -------------------------- */

    function build_editor() {

        /* Check change */
        $editor_wrapper.addEventListener("keyup", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                editor_add_line();
            }
        });

        $editor_wrapper.addEventListener('change', editor_update_view);
        $editor_wrapper.addEventListener('keyup', editor_update_view);
        $editor_wrapper.addEventListener('click', editor_update_view);

        var sortable = Sortable.create($editor, {
            animation: 150,
        });

        /* Add a button */
        document.getElementById('gantt-editor-add').addEventListener('click', function(e) {
            e.preventDefault();
            editor_add_line();
        }, 1);
    }

    var _editor_watch_timeout;

    function editor_update_view() {
        clearTimeout(_editor_watch_timeout);
        _editor_watch_timeout = setTimeout(function() {
            console.log('Refresh values');
            build_tasks_lines();
            build_header_dates();
        }, 200);
    }

    function editor_insert_initial_lines() {
        var _items = JSON.parse(localStorage.getItem('dkgantt_items'));
        if (_items) {
            for (var i = 0, len = _items.length; i < len; i++) {
                editor_add_line(_items[i]);
            }
        }
        else {
            editor_add_line();
        }
    }

    function editor_add_line(_initialValues) {
        _initialValues = _initialValues ? _initialValues : {};
        _initialValues.randnum = Date.now();
        if (!_initialValues.task_name) {
            _initialValues.task_name = '';
        }
        if (!_initialValues.task_duration) {
            _initialValues.task_duration = 5;
        }
        if (!_initialValues.task_delay) {
            _initialValues.task_delay = 0;
        }
        if (!_initialValues.task_restart) {
            _initialValues.task_restart = '';
        }
        else {
            _initialValues.task_restart = 'checked';
        }

        var li = document.createElement('li');
        li.innerHTML = get_template('editor_line', _initialValues);
        $editor.appendChild(li);
        setTimeout(function() {
            li.querySelector('[name="task_name"]').focus();
        }, 50);
    }

    /* Update tasks
    -------------------------- */

    function build_tasks_lines() {
        var tmp_html = '',
            days = 0;

        var _localStorageData = [];
        Array.prototype.forEach.call($editor.querySelectorAll('.gantt-editor__line'), function(el) {
            var _task_duration = el.querySelector('[name="task_duration"]').value,
                _nb_days_tmp = parseInt(_task_duration, 10),
                _nb_days = _nb_days_tmp,
                _task_name = el.querySelector('[name="task_name"]').value,
                _nb_delay_tmp = parseInt(el.querySelector('[name="task_delay"]').value, 10),
                _nb_delay = _nb_delay_tmp,
                _is_restart = el.querySelector('[name="task_restart"]').checked,
                _start_day = days;

            if (_is_restart) {
                days = 0;
                _start_day = 0;
            }

            _start_day += _nb_delay;

            /* Start date */
            var tmp_day = new Date(start_day);
            tmp_day.setDate(start_day.getDate() + days);
            if (tmp_day.getDay() === 0) {
                tmp_day.setDate(tmp_day.getDate() + 1);
                _start_day += 1;
            }
            if (tmp_day.getDay() === 6) {
                tmp_day.setDate(tmp_day.getDate() + 2);
                _start_day += 2;
            }

            /* Duration */
            for (var i = 0; i < _nb_days_tmp; i++) {
                if (tmp_day.getDay() === 0 || tmp_day.getDay() === 6) {
                    _nb_days += 1;
                    _nb_days_tmp++;
                }

                tmp_day.setDate(tmp_day.getDate() + 1);
            }

            tmp_html += get_template('line', {
                distanceleft: 'calc('+_start_day+'*var(--column-width))',
                distancewidth: 'calc('+_nb_days+'*var(--column-width))',
                task_name: _task_name
            });

            _localStorageData.push({
                task_name: _task_name,
                task_duration: _task_duration,
                task_delay: _nb_delay_tmp,
                task_restart: _is_restart
            });

            /* Prepare next task */
            days = _start_day + _nb_days;

        });
        nb_days_visible = days;
        $lines.innerHTML = tmp_html;

        localStorage.setItem('dkgantt_items', JSON.stringify(_localStorageData));

    }

    /* ----------------------------------------------------------
      Build header
    ---------------------------------------------------------- */

    function build_header_dates() {
        var tmp_day,
            tmp_date_day,
            tmp_html = '';
        nb_days_visible = Math.max(min_days_visible, nb_days_visible)
        for (var _d = 0; _d < nb_days_visible; _d++) {
            tmp_day = new Date(start_day);
            tmp_day.setDate(start_day.getDate() + _d);
            tmp_date_day = tmp_day.getDay();
            tmp_html += get_template('header_date', {
                monthvisible: (_d == 0 || tmp_day.getDate() === 1) ? '1' : '0',
                classnameweekend: ((tmp_date_day === 6) || (tmp_date_day === 0) ? '1' : '0'),
                monthname: tmp_day.toLocaleDateString(undefined, {
                    month: 'short'
                }),
                dayname: tmp_day.toLocaleDateString(undefined, {
                    weekday: 'short'
                }).substring(0, 1),
                daynum: tmp_day.getDate()
            });

        }
        $header.innerHTML = tmp_html;
    }

    /* ----------------------------------------------------------
      Helpers
    ---------------------------------------------------------- */

    function get_template(id, vars) {
        var _html = '' + _templates[id];
        if (vars) {
            for (var _k in vars) {
                _html = _html.replace(new RegExp('##' + _k + '##', 'g'), vars[_k]);
            }
        }
        return _html.trim();
    }

    /* ----------------------------------------------------------
      Init
    ---------------------------------------------------------- */

    init();

}
