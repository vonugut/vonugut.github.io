(function($) { // create closure
    $.fn.occ = function(options) {
        var defaults = {
            resetDelay: 10,
            mappings: {
                Neutrophil: {
                    typeCode: [51, 99],
                    typeChar: "3",
                    summable: true
                },
                Lymphocyte: {
                    typeCode: [50, 98],
                    typeChar: "2",
                    summable: true
                },
                Monocyte: {
                    typeCode: [49, 97],
                    typeChar: "1",
                    summable: true
                },
                Eosinophil: {
                    typeCode: [53, 101],
                    typeChar: "5",
                    summable: true
                },
                Basophil: {
                    typeCode: [54, 102],
                    typeChar: "6",
                    summable: true
                },
                Bands: {
                    typeCode: [52, 100],
                    typeChar: "4",
                    summable: true
                },
                Metamyelocyte: {
                    typeCode: [57, 105],
                    typeChar: "9",
                    summable: true
                },
                Myelocyte: {
                    typeCode: [56, 104],
                    typeChar: "8",
                    summable: true
                },
                Promyelocyte: {
                    typeCode: [55, 103],
                    typeChar: "7",
                    summable: true
                },
                Blast: {
                    typeCode: [48, 96],
                    typeChar: "0",
                    summable: true
                },
                nRBC: {
                    typeCode: [190, 110],
                    typeChar: ".",
                    summable: false
                }
            }
        };
        var settings = $.extend({}, defaults, options);
        return this.each(function() { // plugin function
            var container = $(this);
            var backspace = [8, 46];
            var dot = [190, 110];
            var validNumbers = null;
            var validKeys = $.merge([], backspace);
            var keyToChar = {};
            var stack = [];
            var size = 0;
            var input = null;
            var sampleSize = null;
            var total = null;
            var totalCount = null;

            function isValidKey(typeCode) {
                return $.inArray(typeCode, validKeys) > -1;
            }
            function isValidNumber(typeCode) {
                return $.inArray(typeCode, validNumbers) > -1;
            }
            function isBackSpaceKey(typeCode) {
                return $.inArray(typeCode, backspace) > -1;
            }
            function isDotKey(typeCode) {
                return $.inArray(typeCode, dot) > -1;
            }
            function getCharFromKey(typeCode) {
                return keyToChar[typeCode];
            }
            function getIdFromKey(typeCode) {
                return 'id-' + keyToChar[typeCode];
            }
            function getIdCountFromKey(typeCode) {
                return getIdFromKey(typeCode) + '-count';
            }
            function getIdPercentFromKey(typeCode) {
                return getIdFromKey(typeCode) + '-percent';
            }
            function reset() {
                stack = [];
                input.val('');
                $("td.text-right").each(function() {
                    var row = $(this).closest('tr');
                    row.removeClass("success").removeClass("danger");
                    $(this).text("0");
                });
                totalCount.closest('tr').removeClass("success").removeClass("danger");
                totalCount.text("0");
            }
            function animatedReset() {
                var back = $.Event('keydown');
                back.ctrlKey = false;
                back.which = 8;
                if (input.val().toString().length >= 0) {
                    processInput(back);
                    if (input.val().toString().length > 0) {
                        setTimeout(animatedReset, settings.resetDelay);
                    } else {
                        reset();
                    }
                }
            }
            function animatedErase() {
                var back = $.Event('keydown');
                back.ctrlKey = false;
                back.which = 8;
                var currentTotal = parseInt(totalCount.text());
                if (currentTotal > size) {
                    processInput(back);
                    if (currentTotal > size) {
                        setTimeout(animatedErase, settings.resetDelay);
                    }
                }
                if (currentTotal == 0) {
                    reset();
                }
            }
            function clearAlerts() {
                $('tr').each(function() {
                    $(this).removeClass('success').removeClass('danger');
                })
            }
            function colorAlertChange(elements, oldValues) {
                while (elements.length > 0) {
                    var element = elements.pop();
                    var old = oldValues.pop();
                    var current = parseInt(element.text());
                    var row = element.closest('tr');
                    if (current > old) {
                        row.addClass('success');
                    }
                    if (current < old) {
                        row.addClass('danger');
                    }
                }
            }
            function updateStack(typeCode) {
                var value = 0;
                if (isBackSpaceKey(typeCode)) {
                    typeCode = stack.pop();
                    value = -1;
                } else {
                    stack.push(typeCode);
                    value = 1;
                }
                if (typeCode == null) {
                    reset();
                    return;
                }
                var idCount = '#' + getIdCountFromKey(typeCode).replace('.', '\\.');
                var oldCount = parseInt($(idCount).text());
                var newCount = oldCount + value;
                $(idCount).text(newCount);

                // total
                var oldTotal = totalCount.text();
                var newTotal = 0;
                $(".sum").each(function() {
                    newTotal += parseInt($(this).text());
                });
                totalCount.text(newTotal);

                // percentage
                $(".percentage").each(function() {
                    var countElement = $(this).prev("td");
                    if (countElement.hasClass("sum")) {
                        var count = parseInt($(this).prev("td").text());
                        $(this).text(parseFloat('' + (count == 0 ? 0 : (count / newTotal * 100))). toFixed(2));
                    }
                });

                clearAlerts();
                colorAlertChange([$(idCount), totalCount], [oldCount, oldTotal]);
            }
            function updateInput(typeCode) {
                var current = input.val();
                if (isBackSpaceKey(typeCode)) {
                    input.val(current.substring(0, current.length - 1));
                } else {
                    input.val(current + getCharFromKey(typeCode));
                }
            }
            function sampleSizeReached(typeCode){
                return (!isBackSpaceKey(typeCode) && !isDotKey(typeCode) && (parseInt(totalCount.text()) + 1) > size);
            }
            function processInput(e) {
                var key = e.which;
                e.preventDefault();
                if (isValidKey(key) && !sampleSizeReached(key)) {
                    updateInput(key);
                    updateStack(key);
                }
            }
            function processSampleSize(e) {
                var key = e.which;
                if (!isBackSpaceKey(key)) {
                    e.preventDefault();
                }
                if (isValidNumber(key) && !isBackSpaceKey(key)) {
                    var value = parseInt(sampleSize.val() + getCharFromKey(key));
                    sampleSize.val(value);
                }
            }
            function drawTable() {
                $('<style type="text/css"> .break-all { word-break: break-all } .column-header { vertical-align: middle;  height: 34px; line-height: 34px; } .percentage::after { content: "%"; } </style>').appendTo('head');
                var table = $('<table class="table table-hover table-bordered table-condensed table-striped"></table>');
                var tbody = $('<tbody></tbody>');
                container.append('<h2>Cell Counter</h2>').append(table).append('<div class="text-right"><button type="button" class="btn btn-primary" id="reset">Reset</button></div>');
                table.append('<thead><tr><td colspan="3"><div class="column-header pull-left">Differential</div><div class="pull-right"><input type="text" class="form-control" id="sample-size" placeholder="Sample Size"></div></td></tr></thead>');
                table.append(tbody);
                tbody.append('<tr><td colspan="3"><textarea id="input-sequence" class="form-control" placeholder="Input Sequence" rows="6"></textarea></td></tr>');
                $.each(settings.mappings, function(cell, cellSettings) {
                    var typeCode = cellSettings.typeCode[0];
                    var id = getIdFromKey(typeCode);
                    var idCount = getIdCountFromKey(typeCode);
                    var idPercent = getIdPercentFromKey(typeCode);
                    var row = $('<tr id="' + id + '"><td>' + cell + '</td><td id="' + idCount + '" class="text-right' + (cellSettings.summable ? ' sum' : '') + '">0</td><td id="' + idPercent + '" class="text-right percentage' + (cellSettings.summable ? ' percent' : '') + '">0</td></tr>');
                    tbody.append(row);
                });
                tbody.append('<tr><td colspan="3"></td></tr><tr id="total"><td colspan="3"><div class="pull-left">Total</div><div class="pull-right" id="total-count">0</div></td></tr>');
            }
            function initialize() {
                $.each(settings.mappings, function(cell, cellSettings) {
                    var typeCodes = cellSettings.typeCode;
                    var typeChar = cellSettings.typeChar;
                    $.merge(validKeys, typeCodes);
                    $.each(typeCodes, function(index, typeCode) {
                        keyToChar[typeCode] = typeChar;
                    })
                });
                validNumbers = $(validKeys).not(dot).get();
                drawTable();
                input = $("#input-sequence");
                sampleSize = $("#sample-size");
                total = $("#total");
                totalCount = $("#total-count");
                input.keydown(processInput);
                sampleSize.keydown(processSampleSize);
                sampleSize.keyup(function(e) {
                    var key = e.which;
                    if (isValidKey(key)) {
                        var current = sampleSize.val();
                        if (current == '') {
                            size = 0;
                        } else {
                            size = parseInt(current);
                        }
                        var currentTotal = parseInt(totalCount.text());
                        if (size < currentTotal) {
                            animatedErase();
                        }
                    }
                });
                $("#reset").click(animatedReset);
            }

            initialize();
        });
    }
})(jQuery);