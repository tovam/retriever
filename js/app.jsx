const { useState, useEffect } = React;

function ErrorModal({ errorTitle, errorMessage }) {
    return (
        <div>
            <div className="modal show" tabIndex="-1" id="errorModal" style={{display: "block"}}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{ errorTitle }</h5>
                        </div>
                        <div className="modal-body">
                            <p>{ errorMessage }</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </div>
    );
}

function HelpPage() {
    return (
        <div className="pt-5">
            <div className="col text-center help-block">
                <h2>How it works</h2>
                <div className="d-flex flex-column align-items-center">
                    <ol className="how-it-works">
                        <li>
                            <span className="help-number">1</span>
                            Send the above link to someone you want to get a secret from.
                        </li>
                        <li>
                            <span className="help-number">2</span>
                            They add their secret and share the URL Retriever generates.
                        </li>
                        <li>
                            <span className="help-number">3</span>
                            Only you can open that URL in the browser to see their secret.
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

function URLCopy({ url }) {
    const [copyText, setCopyText] = useState('Copy');

    const copyToClipboard = () => {
        navigator.clipboard.writeText(url);
        setCopyText('Copied!');
    };

    return (
        <div className="input-group mb-3">
            <input type="text" className="form-control" value={url} disabled />
            <button className="btn btn-primary btn-copy" onClick={copyToClipboard}>
                {copyText}
            </button>
        </div>
    );
}

function StartPage({ url }) {
    return (
        <div>
            <p className="lead mb-4">Share this URL to get a secret.</p>
            <URLCopy url={url}/>
        </div>
    );
}

function SenderPage({ url, inputData, encrypt, setInputData, setUrl, publicKey }) {
    return (
        <div>
            <p className="lead mb-4">Somebody is requesting a secret<br/>
                <small> No one except for the requester will see this information.</small>
            </p>
            <div className="mb-3">
                <textarea className={"form-control"} id="dataForEncryption" rows="5"
                    placeholder="Fill in what you want to share and click encrypt..." onChange={e=>{setInputData(e.target.value);setUrl("");}}
                    value={!url.endsWith(';long') && inputData || ""}></textarea>
                <small>Size: {!url.endsWith(';long') && inputData.length || 0}</small>
                <div className="encrypt-btn-container" style={{marginTop: "20px"}}>
                    <button type="submit" className="btn btn-warning" onClick={()=>encrypt(publicKey)} >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-lock-fill" viewBox="0 0 16 16" style={{marginRight: "8px"}}>
                            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                        </svg>
                        Encrypt
                    </button>
                </div>

                {url &&
                    <div style={{marginTop: "20px"}}>
                        <h3 className="text-success">Success!</h3>
                        <p className="text-success">Send this URL back to the requester to share the secret.</p>
                        <URLCopy url={url}/>
                        {url.endsWith(';long') && <div><p className="text-success">Also send the requester this encrypted block of text:</p><textarea value={inputData} style={{fontFamily: "Courier", width: "90%", height: "285px"}} /></div>}
                    </div>
                }
            </div>
        </div>
    );
}

function RecipientPageLongSecret() {
    const [inputSecret, setInputSecret] = React.useState("");
    const [decryptedSecret, setDecryptedSecret] = React.useState("");
    
    const handleDecrypt = async () => {
        const [pubKeySer] = window.location.hash.replace('#', '').split(';');
        const privKey = await load_key(window.localStorage.getItem(pubKeySer), 'decrypt');
        
        const encryptedParts = inputSecret.split(';');
        const decryptedParts = [];

        for (const part of encryptedParts) {
            const decryptedValue = await decryptString(privKey, part);
            decryptedParts.push(decryptedValue);
        }

        setDecryptedSecret(decryptedParts.join(''));
    };

    return (
        <div>
            <textarea
                className="form-control monospace"
                placeholder="Paste the encrypted secret here"
                value={inputSecret}
                onChange={e => setInputSecret(e.target.value)}
                rows="5"
                style={{ marginBottom: "10px", borderRadius: "5px" }}
            ></textarea>
            <button className="btn btn-primary" onClick={handleDecrypt}>Decrypt Secret</button>
            {decryptedSecret && (
                <div>
                    <p className="lead mt-4" style={{ fontSize: "16px", color: "#777" }}>Decrypted Secret:</p>
                    <textarea
                        className="form-control"
                        disabled
                        value={decryptedSecret}
                        rows="5"
                        style={{ borderRadius: "5px" }}
                    ></textarea>
                </div>
            )}
        </div>
    );
}

function RecipientPage({ inputData, url }) {
    const [isLongSecret, setIsLongSecret] = useState(false);

    const promptConfirmDeleteKey = () => {
        document.getElementById("deleteKeyLabel").textContent = "Deletion is permanent. You will no longer be able to decrypt or see the secret. Are you sure?";
        document.getElementById("confirmDeleteBtn").classList.remove("d-none");
        document.getElementById("cancelDeleteBtn").classList.remove("d-none");
        document.getElementById("requestDeleteBtn").classList.add("d-none");
    };

    const cancelDeleteKey = () => {
        document.getElementById("deleteKeyLabel").textContent = "Done with this secret?";
        document.getElementById("confirmDeleteBtn").classList.add("d-none");
        document.getElementById("cancelDeleteBtn").classList.add("d-none");
        document.getElementById("requestDeleteBtn").classList.remove("d-none");
    };

    const deleteKey = ()=> {
        let pubKey = localStorage.getItem("publicKey")
        localStorage.removeItem(pubKey)
        localStorage.removeItem("publicKey")
        window.location = window.location.origin + window.location.pathname
    }

    if(url.endsWith(";long"))return <RecipientPageLongSecret/>

    return (
        <div>
            <p className="lead mb-4" style={{fontSize: "16px", color: "#777"}}>Below is the decrypted secret shared with you.</p>
            <textarea className="form-control" id="dataForDecryption" rows="5"
                    disabled style={{borderRadius: "5px"}} value={inputData}></textarea>
            <p id="deleteKeyLabel" className="mt-3">Done with this secret?</p>
            <button id="requestDeleteBtn" className="btn btn-danger" onClick={promptConfirmDeleteKey}>Delete the private key</button>
            <button id="cancelDeleteBtn" className="btn btn-warning d-none mx-1" onClick={cancelDeleteKey}>Nevermind, keep it</button>
            <button id="confirmDeleteBtn" className="btn btn-danger d-none mx-1" onClick={deleteKey}>I am sure, delete it</button>
        </div>

    );
}

function RetrieverApp() {
    const [url, setUrl] = useState('');
    const [inputData, setInputData] = useState('');
    const [encryptedUrl, setEncryptedUrl] = useState('');
    const [newSecret, setNewSecret] = useState(false);
    const [decryptSecret, setDecryptSecret] = useState(false);
    const [errorShow, setErrorShow] = useState(false);
    const [errorTitle, setErrorTitle] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [publicKey, setPublicKey] = useState(null);
    
    const showError = (error, title, message) => {
        console.error(error);
        setErrorShow(true);
        setErrorTitle(title);
        setErrorMessage(message);
        document.body.classList.add('modal-open');
    };

    const encrypt = async () => {
        try {
            const encryptedValues = await encryptStringByChunks(publicKey, inputData);
            if(encryptedValues.length == 1){
                setUrl(window.location.href + ';' + encryptedValues[0]);
                setInputData('');
            }else{
                setUrl(window.location.href + ';long');
                setInputData(encryptedValues.join(';'));
            }
        } catch (error) {
            showError(error, 'Unable to encrypt', 'Double check to make sure the correct link was sent.');
        }
    };

    const decrypt = async () => {
        const [pubKeySer, encryptedText] = window.location.hash.replace('#', '').split(';');
        try {
            const privKey = await load_key(window.localStorage.getItem(pubKeySer), 'decrypt');
            if(encryptedText == "long"){
                setUrl(";long");
                setDecryptSecret(true);
            }else{
                const decryptedValue = await decryptString(privKey, encryptedText);
                setInputData(decryptedValue);
                setDecryptSecret(true);
            }
        } catch (error) {
            let title, message;
            if (error.toString() === 'OperationError') {
                title = 'Unable to decrypt';
                message = 'Unable to decrypt secret. Make sure the url is correct and was not cut off.';
            } else {
                title = 'Unable to load private key';
                message = 'Could not find the private key associated with the public key in the url. Make sure this is the correct browser and the url is correct.';
            }
            showError(error, title, message);
        }
    };

    useEffect(() => {
        if (window.location.hash === '') {
            setNewSecret(true);
            generateKeyPair().then(value => {
                setUrl(window.location.href + '#' + value);
            });
        } else if (window.location.hash.includes(';')) {
            decrypt();
        } else {
            const keyId = window.location.hash.split('#')[1];
            load_key(keyId, 'encrypt').then(value => {
                setPublicKey(value)
            }).catch(error => {
                showError(
                    error,
                    'Unable to load public key',
                    'Unable to load public key from the URL. Make sure the URL is correct.'
                );
            });
        }
    },[]);

    let page = <SenderPage url={url} inputData={inputData} encrypt={encrypt} setInputData={setInputData} publicKey={publicKey} setUrl={setUrl} />
    if(newSecret)page = <StartPage url={url} />
    if(decryptSecret)page = <RecipientPage url={url} inputData={inputData} />

    return (
        <div>
            <div className="px-4 pt-0 my-5 text-center">
                <h1>
                    <a href="index.html"><img src="img/logo.png" alt="Retriever Logo" style={{height: "80px", marginRight: "15px"}} /></a>
                </h1>
                <h1>Retriever</h1>
                <h3>Secure Secrets Retrieval</h3>
                <br/>
                <p className="lead mb-4">Retriever lets you request secrets from anyone <br/> without any of the data going to a server.</p>
                <div className="col-lg-6 mx-auto">
                    <div className="card p-3">
                        {page}
                    </div>
                </div>
                {newSecret && <HelpPage />}
            </div>
            {errorShow && <ErrorModal errorTitle={errorTitle} errorMessage={errorMessage} />}

            {errorShow && null && (
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">{errorTitle}</h4>
                    <p>{errorMessage}</p>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<RetrieverApp />);

