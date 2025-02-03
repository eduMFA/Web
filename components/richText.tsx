import React, {ReactNode} from "react";

type Tag = 'br' | 'ul' | 'li';

type Props = {
    children(tags: Record<Tag, (chunks: ReactNode) => ReactNode>): ReactNode
};

export default function RichText({children}: Props) {
    return (
        <>
            {children({
                br: () => <br/>,
                ul: (content: ReactNode) => <ul className="list-disc list-inside mt-2">{content}</ul>,
                li: (content: ReactNode) => <li>{content}</li>,
            })}
        </>
    );
}