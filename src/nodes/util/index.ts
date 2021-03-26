// https://stackoverflow.com/a/59186182

// Let's assume "class X {}". X itself can be called with "new" keyword, thus it extends this type
type Constructor = new(...args: Array<any>) => any;

// Extracts argument types from class constructor
type ConstructorArgs<TConstructor extends Constructor> =
  TConstructor extends new(...args: infer TArgs) => any ? TArgs : never;

// Extracts class instance type from class constructor
type ConstructorClass<TConstructor extends Constructor> =
  TConstructor extends new(...args: Array<any>) => infer TClass ? TClass : never;

// This is what we want: to be able to create new class instances either with or without "new" keyword
type CallableConstructor<TConstructor extends Constructor> =
  TConstructor & ((...args: ConstructorArgs<TConstructor>) => ConstructorClass<TConstructor>);

function CreateCallableConstructor<TConstructor extends Constructor>(ClassType: TConstructor):
CallableConstructor<TConstructor> {
  function createInstance(
    ...arguments_: ConstructorArgs<TConstructor>
  ): ConstructorClass<TConstructor> {
    return new ClassType(...arguments_);
  }

  createInstance.prototype = ClassType.prototype;
  return createInstance as CallableConstructor<TConstructor>;
}

export default CreateCallableConstructor;
