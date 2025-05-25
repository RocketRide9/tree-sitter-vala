delegate B MapFunc<A, B>(A input);

B map<A, B>(A input, MapFunc func)
{    
    return func(input);
}
