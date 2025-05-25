public delegate int Give();

public int process(int input, Give g)
{
    var a = g();
    a += input + 1;
    return a;
}
