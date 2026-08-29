export abstract class ValueObject<TProps extends object> {
  protected readonly props: Readonly<TProps>;

  protected constructor(props: TProps) {
    this.props = Object.freeze({ ...props });
  }

  equals(other: ValueObject<TProps> | null | undefined): boolean {
    if (other === null || other === undefined) return false;
    if (other === this) return true;
    if (other.constructor !== this.constructor) return false;
    return this.propsEqual(other.props);
  }

  private propsEqual(otherProps: Readonly<TProps>): boolean {
    const keys = Object.keys(this.props) as (keyof TProps)[];
    return keys.every((key) =>
      ValueObject.valueEqual(this.props[key], otherProps[key]),
    );
  }

  private static valueEqual(a: unknown, b: unknown): boolean {
    if (a instanceof ValueObject && b instanceof ValueObject) {
      return a.equals(b);
    }
    return a === b;
  }
}
