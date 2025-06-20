module.exports = grammar({
  name: 'vala',

  word: $ => $.identifier,

  rules: {
    source_file: $ => seq(
      optional($.hashbang_comment),
      repeat($.using_directive),
      repeat(
        choice($.namespace_member, $._statement)
      )
    ),

    // taken from tree-sitter-c
    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: $ => token(prec(1, choice(
      seq('//', /(\\(.|\r?\n)|[^\\\n])*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/'
      )
    ))),
    
    hashbang_marker: _ => '#!',
    hashbang_comment_content: _ => /.*/,
    hashbang_comment: $ => prec(1,
      seq(
        $.hashbang_marker,
        $.hashbang_comment_content
      )
    ),

    using_directive: $ => seq(
      'using',
      $.symbol,
      repeat(seq(',', $.symbol)),
      ';'
    ),

    // symbol: $ => choice(
    //   seq($.symbol, '.', $.identifier),
    //   seq(optional('global::'), $.identifier)
    // ),
    
    symbol: $ => seq(
      optional('global::'),
      sep1($.identifier, '.')
    ),

    identifier: $ => /[@A-Za-z_]\w*/,

    namespace_member: $ => seq(
      repeat($._attribute_list),
      choice(
        $.namespace_declaration,
        $.class_declaration,
        $.interface_declaration,
        $.struct_declaration,
        $.enum_declaration,
        $.errordomain_declaration,
        $.delegate_declaration,
        $.method_declaration,
        $.signal_declaration,
        $.field_declaration,
        $.constant_declaration
      )
    ),

    _attribute_list: $ => seq(
      '[',
      commaSep1($.attribute),
      ']'
    ),

    attribute: $ => seq(
      $.identifier,
      optional(seq(
        '(',
        commaSep1($.attribute_argument),
        ')'
      ))
    ),

    attribute_argument: $ => seq(
      field('left', $.identifier),
      '=',
      field('right', $._expression)
    ),

    _expression: $ => choice(
      $._contained_expression,
      $.initializer,
      $.yield_expression,
      $.lambda_expression,
      $.static_cast_expression,
      $._unary_expression,
      $.multiplicative_expression,
      $.arithmetic_expression,
      $.in_expression,
      $.bitshift_expression,
      $.dynamic_cast_expression,
      $.type_relational_expression,
      $.relational_expression,
      $.equality_expression,
      $.bitwise_and_expression,
      $.bitwise_xor_expression,
      $.bitwise_or_expression,
      $.logical_and_expression,
      $.logical_or_expression,
      $.null_coalescing_expression,
      $.ternary_expression,
      $.assignment_expression
    ),

    // expressions that never need to be wrapped in parentheses
    _contained_expression: $ => choice(
      seq('(', $._expression, ')'),
      $._literal,
      $.array_creation_expression,
      $.object_creation_expression,
      $.this_access,
      $.base_access,
      $.value_access,
      $.member_access_expression,
      $.element_access_expression,
      $.method_call_expression,
      $.sizeof_expression,
      $.typeof_expression,
      $.postfix_expression,
    ),

    // expressions that are contained by an operator to the left
    // for example:
    // if (!yield x())
    //      ^^^^^^^^^ -- we don't need parens here because of the '!' operator
    _left_contained_expression: $ => choice(
      $._contained_expression,
      $.yield_expression,
      $.static_cast_expression,
      $._unary_expression
    ),

    member_access_expression: $ => seq(
      optional(seq(
        $._contained_expression,
        choice('.', '?.', '->'),
      )),
      $.identifier
    ),

    element_access_expression: $ => seq(
      $._contained_expression,
      repeat1($.element_access)
    ),

    element_access: $ => seq(
      '[',
      choice($._expression, $.slice_expression),
      repeat(seq(',', choice($._expression, $.slice_expression))),
      ']'
    ),

    slice_expression: $ => choice(
      seq($._expression, ':', optional($._expression)),
      seq(':', $._expression)
    ),

    argument: $ => choice(
      seq('ref', $._expression),
      seq('out', $._expression),
      $._expression,
      seq($.identifier, ':', $._expression)
    ),

    method_call_expression: $ => seq(
      choice(
        seq('(', $._expression, ')'),
        seq($.member_access_expression, optional($.type_arguments)),
        $._contained_expression
      ),
      '(',
      commaSep($.argument),
      ')'
    ),

    yield_expression: $ => seq('yield', $._expression),

    lambda_expression: $ => seq(
      choice(
        $.identifier,
        seq('(', commaSep($.identifier), ')')
      ),
      '=>',
      choice($._expression, $.block)
    ),

    postfix_expression: $ => prec.left(15, seq($._expression, choice('++', '--'))),
    static_cast_expression: $ => prec.right(14, seq('(', choice($.type, '!', 'owned'), ')', $._expression)),
    typeof_expression: $ => prec.right(14, seq('typeof', '(', $.type, ')')),
    sizeof_expression: $ => prec.right(14, seq('sizeof', '(', $.type, ')')),
    dereferencing_expression: $ => prec.right(14, seq('*', $._left_contained_expression)),
    addressof_expression: $ => prec.right(14, seq('&', $._left_contained_expression)),
    arithmetic_negation_expression: $ => prec.right(14, seq('-', $._left_contained_expression)),
    prefix_expression: $ => prec.right(14, seq(choice('++', '--'), $._left_contained_expression)),
    bitwise_negation_expression: $ => prec.right(14, seq('~', $._left_contained_expression)),
    logical_negation_expression: $ => prec.right(14, seq(choice('!', 'not'), $._left_contained_expression)),
    _unary_expression: $ => prec.right(14, choice(
      $.dereferencing_expression,
      $.addressof_expression,
      $.arithmetic_negation_expression,
      $.prefix_expression,
      $.bitwise_negation_expression,
      $.logical_negation_expression
    )),
    multiplicative_expression: $ => prec.left(13, seq($._expression, choice('*', '/', '%'), $._expression)),
    arithmetic_expression: $ => prec.left(12, seq($._expression, choice('+', '-'), $._expression)),
    bitshift_expression: $ => prec.left(11, seq($._expression, choice('<<', '>>'), $._expression)),
    in_expression: $ => prec.left(10, seq($._expression, optional('not'), 'in', $._expression)),
    dynamic_cast_expression: $ => prec.left(10, seq($._expression, 'as', $.type)),
    type_relational_expression: $ => prec.left(10, seq($._expression, 'is', optional('not'), $.type)),
    relational_expression: $ => prec.left(10, seq($._expression, choice('<', '<=', '>=', '>'), $._expression)),
    equality_expression: $ => prec.left(9, seq($._expression, choice('==', '!='), $._expression)),
    bitwise_and_expression: $ => prec.left(8, seq($._expression, '&', $._expression)),
    bitwise_xor_expression: $ => prec.left(7, seq($._expression, '^', $._expression)),
    bitwise_or_expression: $ => prec.left(6, seq($._expression, '|', $._expression)),
    logical_and_expression: $ => prec.left(5, seq($._expression, choice('&&', 'and'), $._expression)),
    logical_or_expression: $ => prec.left(4, seq($._expression, choice('||', 'or'), $._expression)),
    null_coalescing_expression: $ => prec.left(3, seq($._expression, '??', $._expression)),
    ternary_expression: $ => prec.right(2, seq($._expression, '?', $._expression, ':', $._expression)),

    _assignment_operator: $ => choice('=', '+=', '-=', '|=', '&=', '^=', '/=', '*=', '%=', '<<=', '>>='),
    assignment_expression: $ => prec.right(1, seq($._expression, $._assignment_operator, $._expression)),

    this_access: $ => 'this',

    base_access: $ => 'base',

    value_access: $ => 'value',

    array_creation_expression: $ => seq(
      'new',
      $.type,
      $.inline_array_type,
      optional($.initializer)
    ),

    object_creation_expression: $ => seq(
      'new',
      $.unqualified_type,
      // $.type,
      // optional(seq('.', $.identifier)),
      '(',
      commaSep($.argument),
      ')',
      optional($.object_initializers)
    ),

    object_initializers: $ => seq(
      '{',
      optional(seq(
        commaSep1($.member_initializer),
        optional(',') /* support trailing comma */
      )),
      '}'
    ),

    member_initializer: $ => seq(
      field('member', $.identifier),
      '=',
      field('value', $._expression)
    ),

    initializer: $ => seq(
      '{',
      optional(seq(
        commaSep1($.argument),
        optional(',') /* support trailing comma */
      )),
      '}'
    ),

    boolean: $ => choice('true', 'false'),
    character: $ => /'(\S+|\s)'/,
    integer: $ => choice(/([1-9]\d*|0[0-7]*)[UuLl]?/, /0[xX][A-Fa-f0-9]+/),
    null: $ => 'null',
    real: $ => /\d+(\.\d+)?([eE][+-]?\d+)?[Ff]?/,
    regex: $ => /\/([^\\\/\n]|\\[\\\/A-z0|\[\]^$?.(){}+\-*])+\/[imsxo]*/,
    string: $ => seq(
      '"',
      repeat(choice(
        token(prec(2, /[^"%\\]+/)),
        $.escape_sequence,
        /\\[^abefnrtv\\'"? xXuU]/,
        $.string_formatter,
        /%[^$#0\- +'I\d\\.hlqLjzZtdiouxXeEfFgGaAcsCSpnm%"]/
      )),
      token(prec(2, '"'))
    ),
    escape_sequence: $ => /\\([abefnrtv\\'"? ]|[0-7]{3}|[xX][A-Fa-f0-9]{2}|[uU][A-Fa-f0-9]{4,8})/,
    string_formatter: $ => /%\$?[#0\- +'I]?\d*(\.\d+)?(hh?|ll?|q|L|j|z|Z|t)?[diouxXeEfFgGaAcsCSpnm%]?/,
    template_string: $ => seq(
      '@"',
      repeat(choice(token(prec(2, /([^$"]+|\\")+/)), $.template_string_expression, '$$')),
      token(prec(2, '"'))
    ),
    template_string_expression: $ => choice(
      seq('$(', $._expression, ')'),
      seq('$', $.identifier)
    ),
    verbatim_string: $ => seq(
      '"""',
      repeat(
        /(.|\n)/,
      ),
      '"""'
    ),

    _literal: $ => choice(
      $.boolean,
      $.null,
      $.character,
      $.integer,
      $.real,
      $.regex,
      $.string,
      $.template_string,
      $.verbatim_string
    ),

    type: $ => choice(
      'var',
      seq('void', repeat('*')),
      seq(
        optional('dynamic'),
        optional(choice('unowned', 'owned', 'weak')),
        '(',
        $.type,
        ')',
        repeat1($.array_type)
      ),
      seq(
        optional('dynamic'),
        optional(choice('unowned', 'owned', 'weak')),
        $.symbol,
        optional($.type_arguments),
        repeat('*'),
        optional('?'),
        repeat($.array_type)
      )
    ),

    /**
     * eg. `Gee.List<int>`
    */ 
    unqualified_type: $ => seq(
      $.symbol,
      optional($.type_arguments)
    ),

    /**
    * eg. `<Foo, Object>`
    */
    type_arguments: $ => seq(
      '<',
      commaSep1($.type),
      '>'
    ),

    array_type: $ => seq(
      '[',
      optional($.array_size),
      ']',
      optional('?')
    ),

    array_size: $ => seq(
      $._expression,
      repeat(seq(',', $._expression))
    ),

    modifier: $ => prec.right(choice(
      'abstract',
      'async',
      'class',
      'extern',
      'inline',
      'new',
      'override',
      'partial',
      'sealed',
      'static',
      'virtual',
    )),
    
    access_modifier: $ => prec.right(choice(
      'private',
      'protected',
      'internal',
      'public'
    )),

    namespace_declaration: $ => seq(
      'namespace',
      $.symbol,
      '{',
      repeat($.using_directive),
      repeat($.namespace_member),
      '}'
    ),

    class_declaration: $ => seq(
      optional($.access_modifier),
      repeat($.modifier),
      'class',
      $.unqualified_type,
      field(
        "inheritance_list",
        optional(seq(':', commaSep1($.type))),
      ),
      '{',
      repeat($.class_member),
      '}'
    ),

    class_member: $ => seq(
      repeat($._attribute_list),
      choice(
        $.class_declaration,
        $.interface_declaration,
        $.struct_declaration,
        $.enum_declaration,
        $.delegate_declaration,
        $.method_declaration,
        $.creation_method_declaration,
        $.signal_declaration,
        $.field_declaration,
        $.constant_declaration,
        $.property_declaration,
        $.constructor_declaration,
        $.destructor_declaration
      ),
    ),

    interface_declaration: $ => seq(
      optional($.access_modifier),
      repeat($.modifier),
      'interface',
      $.unqualified_type,
      optional(seq(':', $.type, repeat(seq(',', $.type)))),
      '{',
      repeat($.interface_member),
      '}'
    ),

    interface_member: $ => seq(
      repeat($._attribute_list),
      choice(
        $.class_declaration,
        $.interface_declaration,
        $.struct_declaration,
        $.enum_declaration,
        $.delegate_declaration,
        $.method_declaration,
        $.signal_declaration,
        $.field_declaration,
        $.constant_declaration,
        $.property_declaration
      )
    ),

    struct_declaration: $ => seq(
      optional($.access_modifier),
      repeat($.modifier),
      'struct',
      $.unqualified_type,
      optional(seq(':', $.type, repeat(seq(',', $.type)))),
      '{',
      repeat($.struct_member),
      '}'
    ),

    struct_member: $ => seq(
      repeat($._attribute_list),
      choice(
        $.method_declaration,
        $.creation_method_declaration,
        $.field_declaration,
        $.constant_declaration,
        $.property_declaration
      )
    ),

    enum_declaration: $ => seq(
      optional($.access_modifier),
      repeat($.modifier),
      'enum',
      $.symbol,
      '{',
      commaSep1($.enum_value),
      optional(choice(
        ',',    // support trailing ','
        seq(';', repeat(seq(
          repeat($._attribute_list),
          choice($.method_declaration, $.constant_declaration)
        )))
      )),
      '}'
    ),

    enum_value: $ => seq(
      repeat($._attribute_list),
      $.identifier,
      optional(seq('=', $._expression))
    ),

    errordomain_declaration: $ => seq(
      optional($.access_modifier),
      repeat($.modifier),
      'errordomain',
      $.symbol,
      '{',
      commaSep1($.errorcode),
      optional(choice(
        ',',    // support trailing ','
        seq(';', repeat(seq(repeat($._attribute_list), $.method_declaration)))
      )),
      '}'
    ),

    errorcode: $ => seq(
      repeat($._attribute_list),
      $.identifier,
      optional(seq('=', $._expression))
    ),

    parameter: $ => seq(
      repeat($._attribute_list),
      choice(
        seq(
          optional('params'),
          optional(choice('out', 'ref')),
          $.type,
          $.identifier,
          optional($.inline_array_type),
          optional(seq('=', $._expression))
        ),
        '...'
      )
    ),

    creation_method_declaration: $ => seq(
      optional($.access_modifier),
      repeat($.modifier),
      $.symbol,
      '(',
      commaSep($.parameter),
      ')',
      optional(seq('throws', $.type)),
      optional(seq(choice('requires', 'ensures'), '(', $._expression, ')')),
      choice($.block, ';')
    ),

    delegate_declaration: $ => seq(
      optional($.access_modifier),
      repeat($.modifier),
      'delegate',
      $.type,
      $.symbol,
      optional($.type_arguments),
      '(',
      optional(seq($.parameter, repeat(seq(',', $.parameter)))),
      ')',
      optional(seq('throws', $.type)),
      ';'
    ),
    
    method_declaration: $ => seq(
      optional($.access_modifier),
      repeat($.modifier),
      $.type,
      $.symbol,
      optional($.type_arguments),
      '(',
      commaSep($.parameter),
      ')',
      optional(seq('throws', $.type)),
      optional(seq(choice('requires', 'ensures'), '(', $._expression, ')')),
      choice($.block, ';')
    ),

    signal_declaration: $ => seq(
      optional($.access_modifier),
      repeat($.modifier),
      'signal',
      $.type,
      $.symbol,
      '(',
      optional(seq($.parameter, repeat(seq(',', $.parameter)))),
      ')',
      choice($.block, ';')
    ),

    field_declaration: $ => seq(
      optional($.access_modifier),
      repeat($.modifier),
      $.type,
      $.identifier,
      optional($.inline_array_type),
      optional(seq('=', $._expression)),
      ';'
    ),

    constant_declaration: $ => seq(
      optional($.access_modifier),
      repeat($.modifier),
      'const',
      $.type,
      $.identifier,
      optional($.inline_array_type),
      optional(seq('=', $._expression)),
      ';'
    ),

    inline_array_type: $ => seq(
      '[',
      optional(
        seq($._expression, repeat(seq(',', $._expression)))
      ), 
      ']'
    ),
    
    property_declaration: $ => seq(
      optional($.access_modifier),
      repeat($.modifier),
      $.type,
      $.symbol,
      '{',
      repeat1(choice($.property_default, $.property_accessor)),
      '}'
    ),

    property_default: $ => seq('default', '=', $._expression, ';'),
    
    property_accessor_type: $ => choice(
      seq(optional('owned'), 'get'),
      seq(optional('owned'), 'set', optional('construct')),
      seq('construct', optional('set'))
    ),
    
    property_accessor: $ => seq(
      repeat($._attribute_list),
      optional($.access_modifier),
      $.property_accessor_type,
      choice(';', $.block)
    ),

    constructor_declaration: $ => seq(
      repeat($.modifier),
      'construct',
      $.block
    ),

    destructor_declaration: $ => seq(
      repeat($.modifier),
      '~',
      $.identifier,
      '(', ')',
      $.block
    ),

    local_declaration: $ => seq(
      $.type,
      $.assignment,
      repeat(seq(',', $.assignment)),
      ';'
    ),

    local_function_declaration: $ => seq(
        $.type,
        $.identifier,
        '(',
        optional(seq($.parameter, repeat(seq(',', $.parameter)))),
        ')',
        $.block
    ),

    assignment: $ => prec.dynamic(20, seq(
      field('left', $.identifier),
      optional($.inline_array_type),
      optional(seq('=', $._expression))
    )),

    block: $ => seq(
      '{',
      repeat(choice(
        $._statement,
        $.local_declaration,
        $.local_function_declaration
      )),
      '}'
    ),

    _statement: $ => choice(
      $.if_statement,
      $._statement_without_if
    ),

    // resolves ambiguities with 'else if'
    _statement_without_if: $ => choice(
      $.block,
      $.empty_statement,
      $.expression_statement,
      $.return_statement,
      $.try_statement,
      $.while_statement,
      $.do_statement,
      $.for_statement,
      $.foreach_statement,
      $.break_statement,
      $.continue_statement,
      $.lock_statement,
      $.delete_statement,
      $.throw_statement,
      $.yield_statement,
      $.switch_statement,
      $.with_statement
    ),

    empty_statement: $ => ';',

    expression_statement: $ => seq($._expression, ';'),

    return_statement: $ => seq('return', optional($._expression), ';'),

    if_statement: $ => seq(
      'if', '(', $._expression, ')',
      $._statement,
      repeat($.elseif_statement),
      optional($.else_statement)
    ),

    elseif_statement: $ => seq(
      'else', 'if', '(', $._expression, ')',
      $._statement
    ),

    else_statement: $ => seq(
      'else',
      $._statement_without_if
    ),

    try_statement: $ => seq(
      'try',
      $.block,
      repeat($.catch_clause),
      optional($.finally_clause)
    ),

    catch_clause: $ => seq(
      'catch',
      optional(seq('(', $.type, $.identifier, ')')),
      $.block
    ),

    finally_clause: $ => seq(
      'finally', $.block
    ),

    while_statement: $ => seq(
      'while',
      '(',
      $._expression,
      ')',
      $._statement
    ),

    do_statement: $ => seq(
      'do',
      $._statement,
      'while',
      '(', $._expression, ')',
      ';'
    ),

    for_statement: $ => seq(
      'for',
      '(',
      optional(choice($.local_declaration, seq($._expression, ';'), ';')),
      optional($._expression),
      ';',
      optional(seq($._expression, repeat(seq(',', $._expression)))),
      ')',
      $._statement
    ),

    foreach_statement: $ => seq(
      'foreach',
      '(',
      $.type,
      $.identifier,
      'in',
      $._expression,
      ')',
      $._statement
    ),

    break_statement: $ => seq('break', ';'),

    continue_statement: $ => seq('continue', ';'),

    lock_statement: $ => seq(
      'lock', '(', $._expression, ')',
      $._statement
    ),

    delete_statement: $ => seq(
      'delete', $._expression, ';'
    ),

    throw_statement: $ => seq(
      'throw', $._expression, ';'
    ),

    yield_statement: $ => seq(
      'yield',
      optional(seq('return', $._expression)),
      ';'
    ),

    switch_statement: $ => seq(
      'switch', '(', $._expression, ')',
      '{',
      repeat($.switch_section),
      '}'
    ),

    switch_section: $ => seq(
      choice(
        seq('case', $._expression),
        'default'
      ),
      ':',
      repeat(choice($._statement, $.local_declaration))
    ),

    with_statement: $ => seq(
      'with', '(', $._expression, ')',
      $._statement
    ),

    // --- preprocessor

    _preprocessor_directive_start: $ => /#[\t ]*/,

    _preprocessor_statement: $ => seq(
      $._preprocessor_directive_start,
      choice(
        $.if_directive,
        $.elif_directive,
        $.else_directive,
        $.endif_directive
      )
    ),

    if_directive: $ => seq('if', field('expression', $._preprocessor_expression)),

    elif_directive: $ => seq('elif', field('expression', $._preprocessor_expression)),

    else_directive: $ => 'else',

    endif_directive: $ => 'endif',

    _preprocessor_expression: $ => choice(
      seq('(', $._preprocessor_contained_expression, ')'),
      $.identifier,
      $._literal
    ),

    _preprocessor_contained_expression: $ => choice(
      seq('(', $._preprocessor_contained_expression, ')'),
      $.identifier,
      $._literal,
      prec.right(4, seq('!', $._preprocessor_expression)),
      prec.left(3, seq($._preprocessor_expression, choice('==', '!='), $._preprocessor_expression)),
      prec.left(2, seq($._preprocessor_expression, '&&', $._preprocessor_expression)),
      prec.left(1, seq($._preprocessor_expression, '||', $._preprocessor_expression)),
    )
  },

  conflicts: $ => [
    [$.symbol, $.member_access_expression],                             // disambiguate member access and static cast expressions
    [$.symbol, $.member_access_expression, $.lambda_expression],        // head of lambda expression may be head of symbol or MA
    [$.type],                                                           // disambiguate between 'X as <type *> ...'  and '(X as <type>)* ...'
    [$.array_type],                                                     // when 'X[]? ...' could also be '(X[]) ? ...'
    [$._contained_expression, $.method_call_expression],                // for ambiguity because of contained expressions
    [$.element_access_expression],                                      // for ambiguity because of contained expressions
    [$.initializer, $.block],                                           // because {} is ambiguous in statement-expression contexts
    [$.if_statement],                                                   // because of ambiguity with nested if statements
    [$._expression, $._left_contained_expression]
  ],

  extras: $ => [
    /\s|\\\r?\n/,
    $.comment,
    $._preprocessor_statement
  ],
});


/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @returns {SeqRule}
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

/**
 * Creates a rule to match two or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @returns {SeqRule}
 */
function commaSep2(rule) {
  return seq(rule, repeat1(seq(',', rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @returns {ChoiceRule}
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}

/**
 * Creates a rule to match one or more of the rules separated by `separator`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {SeqRule}
 */
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by `separator`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {ChoiceRule}
 */
function sep(rule, separator) {
  return optional(sep1(rule, separator));
}
