'use strict';

// item: {
//     label: "Game Name"
//     value: "current value of item"
//     placeholder: "placeholder text"
//     get/set: function()
// }
export function formTable(title, items, submitFn, formErr) {
    let tableElement = mu('table');
    items.forEach(item => {
        let rowElement = mu('tr')
            .appendTo(tableElement)
            .append(mu('td')
                .setText(item.label))
            .append(mu('td')
                .append(inputFromSpec(item)));
        });

    return form(title, tableElement, submitFn, formErr);
};

function inputFromSpec(spec) {
    switch (spec.type) {
        case 'fixed':
            return fixedInput(spec);
        case 'text':
            return textInput(spec);
        case 'int':
            return intInput(spec);
        case 'colorpicker':
            return colorpickerInput(spec);
        case 'note':
            return noteInput(spec);
        case 'select':
            return selectInput(spec);
    }
}

function fixedInput(spec) {
    return mu('span')
        .setText(spec.value);
}

function textInput(spec) {
    return mu('input')
        .runIf(spec.focus, element => {
            element.attr('oncreate', vnode => {
                vnode.dom.focus();
                vnode.dom.select();
            });
        })
        .attr('value', spec.value)
        .attr('placeholder', spec.placeholder)
        .attrIf(spec.disable, 'disabled', 'disabled')
        .change(evt => {
            spec.set(evt.target.value);

            if (spec.onchange) {
                spec.onchange(evt);
            }
        })
        .input(evt => {
            spec.set(evt.target.value);

            if (spec.oninput) {
                spec.oninput(evt);
            }
        });
}

function intInput(spec) {
    let inputSpan = mu('span')
        .append(mu('input')
            .runIf(spec.focus, element => {
                element.attr('oncreate', vnode => {
                    vnode.dom.focus();
                    vnode.dom.select();
                });
            })
            .attr('value', '' + spec.value)
            .attrIf(spec.disable, 'disabled', 'disabled')
            .attr('placeholder', spec.placeholder)
            .change(evt => {
                let value = parseInt(evt.target.value);
                if (isNaN(value)) {
                    return false;
                }
                spec.set(value);
    
                if (spec.onchange) {
                    spec.onchange(evt);
                }
            })
            .input(evt => {
                let value = parseInt(evt.target.value);
                if (isNaN(value)) {
                    return false;
                }
                spec.set(value);
    
                if (spec.oninput) {
                    spec.oninput(evt);
                }
            }));
    if (spec.extraButtons) {
        spec.extraButtons.forEach(buttonSpec => {
            inputSpan
                .append(mu('button')
                    .setText(buttonSpec.text)
                    .click(evt => {
                        evt.preventDefault();
                        spec.set(buttonSpec.newValue());
             
                        if (spec.oninput) {
                            spec.oninput(evt);
                        }
                    }));
        });
    }
    return inputSpan;
}

function colorpickerInput(spec) {
    let picker = mu('div');
    spec.options.forEach((c, i) => {
        picker
            .append(colorSwatch(c, i === spec.valueIndex)
                .click(evt => {
                spec.set(i);

                if (spec.onchange) {
                    spec.onchange(evt);
                }
            }));
    });

    return picker;
}

function noteInput(spec) {
    return mu('span')
        .addClass('note')
        .setText(spec.value);
}

function selectInput(spec) {
    let select = mu('select')
        .input(evt => {
            let valueIndex = evt.target.selectedIndex;
            spec.set(valueIndex);

            if (spec.onchange) {
                spec.onchange(evt);
            }
        });

    spec.options.forEach((option, i) => {
        select.append(mu('option')
            .attr('value', i)
            .setText(option.text)
            .runIf(spec.valueIndex === i, element => {
                element.attr('selected', 'selected');
            }));
    });

    let inputSpan = mu('span')
        .append(select);
    return inputSpan;
}

export function keyValueTable(title, items) {
    let container = mu('div');
    if (title) {
        container.append(
            mu('h2')
                .setText(title));
    }

    let tableElement = mu('table');
    items.forEach(item => {
        let rowElement = mu('tr')
            .appendTo(tableElement)
            .append(mu('td')
                .setText(item.label))
            .append(mu('td')
                .setText(item.value));
        });

    container
        .append(tableElement);

    return container;
};

export function form(title, formContents, submitFn, formErr) {
   let container = mu('div');
    if (title) {
        container.append(
            mu('h2')
                .setText(title));
    }

    // TODO(treaster): Add form presubmit validation
    // TODO(treaster): Add error handling for invalid submits
    container
        .append(mu('form')
            .submit(evt => {
                evt.preventDefault();
                submitFn(evt);
            }) 
            .append(formContents)
            .append(mu('div')
                .addClass('submit_row')
                .append(mu('span')
                    .addClass('form_submit')
                    .append(mu('button')
                        .attr('type', 'submit')
                        .setText('submit')))
                .appendIf(formErr, mu('span')
                    .addClass('form_error')
                    .runIf(formErr, element => {
                        element.setText(formErr);
                    }))));

    return container;
};

export function colorSwatch(color, selected) {
    return mu('span')
        .addClass('colorswatch')
        .addClassIf(selected, 'selected')
        .attr('style', {backgroundColor: '#' + color});
}
