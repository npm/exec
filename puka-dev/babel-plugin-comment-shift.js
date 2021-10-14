// Babel 7 has an annoying behavior of squeezing comments onto the previous
// line, which impedes readability of the distributed file. Fortunately, it's
// just a parsing problem, which means it can be corrected with an AST
// transformation.

const visitBlockLike = ({ node }) => {
  for (let i = 0, iMax = node.body.length - 1; i < iMax; i++) {
    const child = node.body[i];
    if (
      child.trailingComments
      && child.trailingComments[0].loc.start.line > child.loc.end.line
    ) {
      const nextChild = node.body[i + 1];
      if (nextChild.leadingComments) {
        nextChild.leadingComments.unshift(...child.trailingComments);
      } else {
        nextChild.leadingComments = child.trailingComments;
      }
      delete child.trailingComments;
    }
  }
};

const plugin = {
  visitor: {
    BlockStatement: visitBlockLike,
    Program: visitBlockLike,
  },
};

module.exports = () => plugin;
